<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Transaction;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    // =============================================================
    // INDEX — ambil semua order (admin & kasir)
    // GET /api/orders
    // GET /api/orders?status=pending
    // GET /api/orders?date_from=2025-01-01&date_to=2025-12-31
    // =============================================================
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items.product', 'transaction'])
                      ->latest();
        // ↑ with() = eager load semua relasi sekaligus
        // items.product = load items dulu, lalu tiap item load productnya
        // latest() = urut dari yang terbaru (order by created_at desc)

        // ----- FILTER STATUS -----
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // ----- FILTER USER -----
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // ----- FILTER TANGGAL -----
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
            // ↑ whereDate() = compare hanya bagian tanggalnya saja
            // Tidak terpengaruh jam/menit/detik
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = min($request->get('per_page', 10), 100);
        $orders  = $query->paginate($perPage);

        return response()->json([
            'message' => 'Data order berhasil diambil.',
            'data'    => $orders->map(fn($o) => $this->formatOrder($o)),
            'meta'    => [
                'current_page' => $orders->currentPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
                'last_page'    => $orders->lastPage(),
            ],
        ], 200);
    }

    // =============================================================
    // MY ORDERS — riwayat order milik customer yang login
    // GET /api/orders/my/history
    // =============================================================
    public function myOrders(Request $request): JsonResponse
    {
        $orders = Order::with(['items.product', 'transaction'])
                       ->where('user_id', $request->user()->id)
                       // ↑ Hanya ambil order milik user yang sedang login
                       ->latest()
                       ->paginate(10);

        return response()->json([
            'message' => 'Riwayat order kamu berhasil diambil.',
            'data'    => $orders->map(fn($o) => $this->formatOrder($o)),
            'meta'    => [
                'current_page' => $orders->currentPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
                'last_page'    => $orders->lastPage(),
            ],
        ], 200);
    }

    // =============================================================
    // SHOW — detail satu order
    // GET /api/orders/{id}
    // =============================================================
    public function show(Request $request, int $id): JsonResponse
    {
        $order = Order::with(['user', 'items.product', 'transaction'])->find($id);

        if (! $order) {
            return response()->json([
                'message' => 'Order tidak ditemukan.',
            ], 404);
        }

        // Kalau bukan admin/kasir, hanya boleh lihat order sendiri
        $user = $request->user();
        if ($user->role === 'user' && $order->user_id !== $user->id) {
            return response()->json([
                'message' => 'Kamu tidak punya akses ke order ini.',
            ], 403);
        }

        return response()->json([
            'message' => 'Detail order berhasil diambil.',
            'data'    => $this->formatOrder($order),
        ], 200);
    }

    // =============================================================
    // STORE — buat order baru dari cart
    // POST /api/orders
    // Body:
    // {
    //   "items": [
    //     { "product_id": 1, "quantity": 2 },
    //     { "product_id": 3, "quantity": 1 }
    //   ],
    //   "notes": "Tolong dibungkus"
    // }
    // =============================================================
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items'                => ['required', 'array', 'min:1'],
            'items.*.product_id'   => ['required', 'exists:products,id'],
            'items.*.quantity'     => ['required', 'integer', 'min:1'],
            'notes'                => ['nullable', 'string', 'max:500'],
            'customer_phone'       => ['nullable', 'string', 'max:20'],
            // ↑ Nomor HP customer untuk kirim struk WA, boleh kosong
        ]);

        // ----- WAJIB ADA SHIFT AKTIF -----
        // Setiap transaksi HARUS terjadi di dalam shift yang sedang berjalan,
        // supaya rekonsiliasi kas saat tutup shift selalu akurat.
        // Shift bersifat per-tenant (dipakai bersama semua kasir), jadi tidak
        // difilter per-user — TenantScope otomatis membatasi ke tenant ini.
        // (Frontend juga sudah memblokir, ini lapisan pengaman di backend.)
        $shift = Shift::where('status', 'open')
            ->latest('opened_at')
            ->first();

        if (! $shift) {
            return response()->json([
                'message'   => 'Belum ada shift yang dibuka. Buka shift terlebih dahulu sebelum bertransaksi.',
                'no_shift'  => true,
            ], 422);
        }

        // ===== JALANKAN DALAM DATABASE TRANSACTION =====
        // ↑ DB::transaction() = semua query di dalamnya harus sukses semua
        // Kalau ada 1 yang gagal, semua dibatalkan (rollback)
        // Mencegah stok berkurang tapi order tidak tersimpan
        $order = DB::transaction(function () use ($validated, $request, $shift) {

            $subtotal = 0;
            $items    = [];

            // ----- VALIDASI STOK & HITUNG TOTAL -----
            foreach ($validated['items'] as $item) {

                $product = Product::lockForUpdate()->find($item['product_id']);
                // ↑ lockForUpdate() = lock baris ini di database
                // Mencegah 2 user beli produk yang sama secara bersamaan
                // sehingga stok tidak minus

                // Produk bisa null kalau product_id dari tenant lain (rule
                // exists: tidak menghormati Global Scope) → jadikan 422
                // alih-alih error 500.
                if (! $product) {
                    throw ValidationException::withMessages([
                        'items.*.product_id' => 'Produk tidak ditemukan.',
                    ]);
                }

                if (! $product->is_active) {
                    throw new \Exception("Produk {$product->name} tidak tersedia.");
                }

                if ($product->stock < $item['quantity']) {
                    throw new \Exception(
                        "Stok {$product->name} tidak cukup. Stok tersedia: {$product->stock}."
                    );
                    // ↑ Kalau stok kurang, lempar exception
                    // DB::transaction() otomatis rollback semua perubahan
                }

                $itemSubtotal = $product->price * $item['quantity'];
                $subtotal    += $itemSubtotal;

                $items[] = [
                    'product_id' => $product->id,
                    'quantity'   => $item['quantity'],
                    'price'      => $product->price,
                    // ↑ Snapshot harga saat ini — penting!
                    // Kalau harga produk berubah besok, harga di order ini tetap
                    'cost'       => $product->cost,
                    // ↑ Snapshot harga modal (COGS) — dipakai laporan profit.
                    // Null kalau produk belum diisi cost-nya.
                    'subtotal'   => $itemSubtotal,
                    // Snapshot stok untuk pencatatan ledger
                    'before_stock' => $product->stock,
                    'after_stock'  => $product->stock - $item['quantity'],
                ];

                // Kurangi stok produk
                $product->decreaseStock($item['quantity']);
                // ↑ Method dari Model Product: $this->decrement('stock', $quantity)
            }

            // ----- HITUNG TAX & TOTAL -----
            $tax   = $subtotal * 0.11;
            // ↑ PPN 11%
            $total = $subtotal + $tax;

            // ----- CARI / BUAT PELANGGAN -----
            // Nomor HP yang diisi kasir otomatis jadi entitas customer
            // (CRM): kalau sudah pernah belanja dengan nomor itu, order ini
            // tertaut ke pelanggan yang sama.
            $customer = Customer::findOrCreateByPhone(
                $validated['customer_phone'] ?? null,
                $request->user()->tenant_id
            );

            // ----- BUAT ORDER -----
            $order = Order::create([
                'tenant_id'      => $request->user()->tenant_id,
                'user_id'        => $request->user()->id,
                'customer_id'    => $customer?->id,
                'shift_id'       => $shift->id,
                'order_number'   => Order::generateOrderNumber(),
                'status'         => 'pending',
                'subtotal'       => $subtotal,
                'tax'            => $tax,
                'total'          => $total,
                'notes'          => $validated['notes'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
            ]);

            // ----- SIMPAN ITEMS -----
            $order->items()->createMany($items);
            // ↑ createMany() = insert banyak baris sekaligus lebih efisien
            // dari pada loop insert satu-satu

            // ----- CATAT PERGERAKAN STOK (inventory ledger) -----
            foreach ($items as $item) {
                InventoryService::record(
                    $item['product_id'],
                    $request->user()->tenant_id,
                    'sale',
                    $item['quantity'],
                    $item['before_stock'],
                    $item['after_stock'],
                    'order',
                    $order->id,
                    $request->user()->id
                );
            }

            return $order;
        });

        // Load relasi setelah transaction selesai
        $order->load(['user', 'items.product', 'transaction']);

        return response()->json([
            'message' => 'Order berhasil dibuat. Lanjutkan ke pembayaran.',
            'data'    => $this->formatOrder($order),
        ], 201);
    }

    // =============================================================
    // UPDATE STATUS — update status order
    // PATCH /api/orders/{id}/status
    // Role: admin & kasir
    // =============================================================
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $order = Order::find($id);

        if (! $order) {
            return response()->json([
                'message' => 'Order tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'status'         => ['required', 'in:pending,paid,cancelled'],
            'payment_method' => ['nullable', 'string', 'in:cash,qris,bank_transfer,credit_card,other'],
        ]);

        // Kalau order dibatalkan, kembalikan stok dan cancel transaksi pending
        if ($validated['status'] === 'cancelled' && $order->status !== 'cancelled') {
            DB::transaction(function () use ($order, $validated) {
                foreach ($order->items as $item) {
                    $beforeStock = $item->product->stock;
                    $item->product->increment('stock', $item->quantity);
                    InventoryService::record(
                        $item->product_id,
                        $order->tenant_id,
                        'cancel',
                        $item->quantity,
                        $beforeStock,
                        $beforeStock + $item->quantity,
                        'order',
                        $order->id
                    );
                }
                $order->update(['status' => $validated['status']]);

                if ($order->transaction && $order->transaction->status === 'pending') {
                    $order->transaction->update(['status' => 'cancel']);
                }
            });
        } elseif ($validated['status'] === 'paid' && $order->status !== 'paid') {
            DB::transaction(function () use ($order, $validated) {
                $order->update(['status' => 'paid']);

                // Buat Transaction record untuk pembayaran tunai jika belum ada settlement
                $hasSettlement = Transaction::where('order_id', $order->id)
                    ->where('status', 'settlement')
                    ->exists();

                if (! $hasSettlement) {
                    $method = $validated['payment_method'] ?? 'cash';
                    Transaction::create([
                        'order_id'          => $order->id,
                        'midtrans_order_id' => $order->order_number . '-' . $method . '-' . time(),
                        'status'            => 'settlement',
                        'payment_method'    => $method,
                        'amount'            => $order->total,
                        'paid_at'           => now(),
                    ]);
                }
            });
        } else {
            $order->update(['status' => $validated['status']]);
        }

        $order = $order->fresh()->load(['user', 'items.product', 'transaction']);

        if ($validated['status'] === 'paid') {
            \App\Jobs\SendWhatsAppReceipt::dispatch($order->id);
        }

        return response()->json([
            'message' => 'Status order berhasil diupdate.',
            'data'    => $this->formatOrder($order),
        ], 200);
    }

    // =============================================================
    // HELPER — format data order untuk response
    // =============================================================
    private function formatOrder(Order $order): array
    {
        return [
            'id'           => $order->id,
            'order_number' => $order->order_number,
            'status'       => $order->status,
            'subtotal'     => $order->subtotal,
            'tax'          => $order->tax,
            'total'        => $order->total,
            'notes'          => $order->notes,
            'customer_phone' => $order->customer_phone,
            'user'           => $order->relationLoaded('user') ? [
                'id'   => $order->user->id,
                'name' => $order->user->name,
            ] : null,
            'items'        => $order->relationLoaded('items')
                ? $order->items->map(fn($item) => [
                    'id'           => $item->id,
                    'product_id'   => $item->product_id,
                    'product_name' => $item->product->name ?? '-',
                    'quantity'     => $item->quantity,
                    'price'        => $item->price,
                    // ↑ Harga snapshot saat order dibuat, bukan harga sekarang
                    'subtotal'     => $item->subtotal,
                ])
                : [],
            'transaction'  => $order->relationLoaded('transaction') && $order->transaction
                ? [
                    'status'         => $order->transaction->status,
                    'payment_method' => $order->transaction->payment_method,
                    'paid_at'        => $order->transaction->paid_at?->format('d M Y H:i'),
                ]
                : null,
            'created_at'   => $order->created_at->format('d M Y H:i'),
        ];
    }
}