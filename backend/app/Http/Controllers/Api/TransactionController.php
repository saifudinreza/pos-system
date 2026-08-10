<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendWhatsAppReceipt;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

class TransactionController extends Controller
{
    public function __construct()
    {
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized  = true;
        Config::$is3ds        = true;

        $notifUrl = config('services.midtrans.notification_url');
        if ($notifUrl) {
            Config::$overrideNotifUrl = $notifUrl;
        }
    }

    private function configureServerKey(Request $request): void
    {
        $tenant    = $request->user()->tenant;
        $serverKey = $tenant?->midtrans_server_key ?? config('services.midtrans.server_key');

        if (empty($serverKey)) {
            abort(422, 'Midtrans belum dikonfigurasi. Masuk ke Profil → atur Server Key & Client Key Midtrans terlebih dahulu.');
        }

        Config::$serverKey    = $serverKey;
        Config::$isProduction = $tenant?->midtransIsProduction() ?? config('services.midtrans.is_production');
    }

    // Versi configureServerKey() untuk webhook — tidak ada user login,
    // jadi tenant dicari lewat transaksi yang sedang diverifikasi.
    private function configureServerKeyForTenant(?Tenant $tenant): void
    {
        Config::$serverKey    = $tenant?->midtrans_server_key ?? config('services.midtrans.server_key');
        Config::$isProduction = $tenant?->midtransIsProduction() ?? config('services.midtrans.is_production');
    }

    // =============================================================
    // INDEX — ambil semua transaksi (admin & kasir)
    // GET /api/transactions
    // =============================================================
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $query = Transaction::with('order.user')
            ->when($tenantId, function ($q) use ($tenantId) {
                $q->whereHas('order', fn($o) => $o->where('tenant_id', $tenantId));
            })
            ->latest();

        // ----- FILTER STATUS -----
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // ----- FILTER TANGGAL -----
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage      = min($request->get('per_page', 10), 100);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'message' => 'Data transaksi berhasil diambil.',
            'data'    => $transactions->map(fn($t) => $this->formatTransaction($t)),
            'meta'    => [
                'current_page' => $transactions->currentPage(),
                'per_page'     => $transactions->perPage(),
                'total'        => $transactions->total(),
                'last_page'    => $transactions->lastPage(),
            ],
        ], 200);
    }

    // =============================================================
    // SHOW — detail satu transaksi (include order items)
    // GET /api/transactions/{id}
    // =============================================================
    public function show(Request $request, int $id): JsonResponse
    {
        $transaction = Transaction::with('order.user', 'order.items.product')->find($id);

        if (! $transaction) {
            return response()->json([
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        // Customer hanya boleh lihat transaksi milik sendiri
        $user = $request->user();
        if ($user->role === 'user' && $transaction->order->user_id !== $user->id) {
            return response()->json([
                'message' => 'Kamu tidak punya akses ke transaksi ini.',
            ], 403);
        }

        return response()->json([
            'message' => 'Detail transaksi berhasil diambil.',
            'data'    => $this->formatTransaction($transaction),
        ], 200);
    }

    // =============================================================
    // MY TRANSACTIONS — riwayat transaksi milik customer
    // GET /api/transactions/my/history
    // =============================================================
    public function myTransactions(Request $request): JsonResponse
    {
        $transactions = Transaction::with('order')
            ->whereHas('order', function ($q) use ($request) {
                $q->where('user_id', $request->user()->id);
                // ↑ whereHas() = filter transaksi yang order-nya milik user ini
            })
            ->latest()
            ->paginate(10);

        return response()->json([
            'message' => 'Riwayat transaksi kamu berhasil diambil.',
            'data'    => $transactions->map(fn($t) => $this->formatTransaction($t)),
            'meta'    => [
                'current_page' => $transactions->currentPage(),
                'per_page'     => $transactions->perPage(),
                'total'        => $transactions->total(),
                'last_page'    => $transactions->lastPage(),
            ],
        ], 200);
    }

    // =============================================================
    // CREATE — buat transaksi baru & ambil Snap Token Midtrans
    // POST /api/transactions
    // Body: { "order_id": 2 }
    // =============================================================
    public function create(Request $request): JsonResponse
    {
        // Pembayaran digital (QRIS/e-wallet/VA) hanya untuk Pro & Enterprise
        // Paket FREE melayani pembayaran tunai saja.
        if ($this->getEffectivePlan($request->user()) === 'free') {
            return response()->json([
                'message'       => 'Pembayaran QRIS/digital hanya tersedia untuk paket Pro & Enterprise. Upgrade untuk mengaktifkannya.',
                'plan_required' => 'pro',
            ], 422);
        }

        $this->configureServerKey($request);

        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
        ]);

        $order = Order::with(['user', 'items.product'])->find($validated['order_id']);

        // Order tidak ketemu (termasuk order milik tenant lain — TenantScope
        // menyaringnya) → jangan lanjut, kalau tidak error 500.
        if (! $order) {
            return response()->json(['message' => 'Order tidak ditemukan.'], 404);
        }

        // Validasi order masih pending
        if (! $order->isPending()) {
            return response()->json([
                'message' => 'Order ini sudah diproses atau dibatalkan.',
                'status'  => $order->status,
            ], 422);
        }

        // Validasi order milik user yang login
        // (kecuali kasir/admin boleh proses order siapapun)
        $user = $request->user();
        if ($user->role === 'user' && $order->user_id !== $user->id) {
            return response()->json([
                'message' => 'Kamu tidak bisa memproses order orang lain.',
            ], 403);
        }

        // Cek apakah sudah ada transaksi pending untuk order ini
        $existingTransaction = Transaction::where('order_id', $order->id)
            ->where('status', 'pending')
            ->first();

        if ($existingTransaction) {
            // Kembalikan snap token yang sudah ada daripada buat baru
            return response()->json([
                'message' => 'Transaksi sudah ada. Lanjutkan pembayaran.',
                'data'    => $this->formatTransaction($existingTransaction),
            ], 200);
        }

        // test
        // ===== BUAT TRANSAKSI KE MIDTRANS =====
        $midtransOrderId = $order->order_number . '-' . time();
        // ↑ Tambah timestamp supaya unik kalau order pernah retry
        // Midtrans tidak boleh terima order_id yang sama 2x

        // Format item detail untuk Midtrans
        $itemDetails = $order->items->map(fn($item) => [
            'id'       => $item->product_id,
            'price'    => (int) $item->price,
            'quantity' => $item->quantity,
            'name'     => substr($item->product->name, 0, 50),
            // ↑ Midtrans maksimal 50 karakter untuk nama item
        ])->toArray();

        // Tambahkan tax sebagai item tersendiri
        $itemDetails[] = [
            'id'       => 'TAX',
            'price'    => (int) $order->tax,
            'quantity' => 1,
            'name'     => 'PPN 11%',
        ];

        // Parameter yang dikirim ke Midtrans
        $params = [
            'transaction_details' => [
                'order_id'     => $midtransOrderId,
                'gross_amount' => (int) $order->total,
                // ↑ Midtrans butuh integer, bukan decimal
            ],
            'customer_details' => [
                'first_name' => $order->user->name,
                'email'      => $order->user->email,
                'phone'      => $order->user->phone ?? '-',
            ],
            'item_details' => $itemDetails,
            // ↑ Total item_details harus sama persis dengan gross_amount
            // Kalau tidak sama Midtrans akan error
        ];

        // Request Snap Token ke Midtrans
        $snapToken = Snap::getSnapToken($params);
        // ↑ Ini yang dikirim ke frontend untuk buka popup Midtrans
        // Frontend pakai: window.snap.pay(snapToken)

        // Simpan transaksi ke database
        $transaction = Transaction::create([
            'order_id'          => $order->id,
            'midtrans_order_id' => $midtransOrderId,
            'status'            => 'pending',
            'amount'            => $order->total,
            'snap_token'        => $snapToken,
        ]);

        $transaction->load('order.user');

        return response()->json([
            'message'    => 'Transaksi berhasil dibuat. Lanjutkan pembayaran.',
            'data'       => $this->formatTransaction($transaction),
            'snap_token' => $snapToken,
            // ↑ snap_token di root response supaya mudah diambil frontend
        ], 201);
    }

    // =============================================================
    // CANCEL — batalkan transaksi pending secara manual
    // PATCH /api/transactions/{id}/cancel
    // Role: admin & kasir
    // =============================================================
    public function cancelTransaction(int $id): JsonResponse
    {
        $transaction = Transaction::with('order.items.product')->find($id);

        if (! $transaction) {
            return response()->json(['message' => 'Transaksi tidak ditemukan.'], 404);
        }

        if ($transaction->status !== 'pending') {
            return response()->json([
                'message' => 'Hanya transaksi berstatus "menunggu" yang bisa dibatalkan.',
            ], 422);
        }

        DB::transaction(function () use ($transaction) {
            $transaction->update(['status' => 'cancel']);

            if ($transaction->order && $transaction->order->status !== 'cancelled') {
                // Kembalikan stok setiap item (guard: cek order belum
                // cancelled — mencegah stok kembung kalau sudah dibatalkan
                // lewat jalur lain, misal webhook Midtrans yang mendahului)
                foreach ($transaction->order->items as $item) {
                    $beforeStock = $item->product->stock;
                    $item->product->increment('stock', $item->quantity);
                    \App\Services\InventoryService::record(
                        $item->product_id,
                        $transaction->order->tenant_id,
                        'cancel',
                        $item->quantity,
                        $beforeStock,
                        $beforeStock + $item->quantity,
                        'transaction',
                        $transaction->id
                    );
                }
                $transaction->order->update(['status' => 'cancelled']);
            }
        });

        $transaction->load('order.user');

        return response()->json([
            'message' => 'Transaksi berhasil dibatalkan.',
            'data'    => $this->formatTransaction($transaction),
        ], 200);
    }

    // =============================================================
    // PAY CASH — tandai order sebagai lunas tunai (tanpa Midtrans)
    // POST /api/transactions/cash
    // Body: { "order_id": 5, "amount_tendered": 50000 }
    // Role: admin & kasir
    // =============================================================
    public function payCash(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id'        => ['required', 'exists:orders,id'],
            'amount_tendered' => ['nullable', 'numeric', 'min:0'],
        ]);

        $order = Order::with(['items.product'])->find($validated['order_id']);

        if (! $order) {
            return response()->json(['message' => 'Order tidak ditemukan.'], 404);
        }

        if (! $order->isPending()) {
            return response()->json([
                'message' => 'Order ini sudah diproses atau dibatalkan.',
                'status'  => $order->status,
            ], 422);
        }

        // Cek apakah sudah ada transaksi pending untuk order ini — jika ada, selesaikan
        $transaction = Transaction::where('order_id', $order->id)->first();

        DB::transaction(function () use ($order, $transaction, $validated) {
            $midtransOrderId = $order->order_number . '-' . time();

            if ($transaction) {
                // Update transaksi yang sudah ada
                $transaction->update([
                    'status'         => 'settlement',
                    'payment_method' => 'cash',
                    'paid_at'        => now(),
                ]);
            } else {
                // Buat transaksi baru langsung settlement
                Transaction::create([
                    'order_id'          => $order->id,
                    'midtrans_order_id' => $midtransOrderId,
                    'status'            => 'settlement',
                    'payment_method'    => 'cash',
                    'amount'            => $order->total,
                    'paid_at'           => now(),
                ]);
            }

            // Update status order menjadi paid
            $order->update(['status' => 'paid']);
        });

        $order->load('user');
        $finalTransaction = Transaction::where('order_id', $order->id)->with('order.user')->first();

        $kembalian = isset($validated['amount_tendered'])
            ? max(0, (float) $validated['amount_tendered'] - (float) $order->total)
            : 0;

        return response()->json([
            'message'   => 'Pembayaran tunai berhasil.',
            'kembalian' => $kembalian,
            'data'      => $this->formatTransaction($finalTransaction),
        ], 200);
    }

    // =============================================================
    // WEBHOOK — dipanggil otomatis oleh server Midtrans
    // POST /api/webhook/midtrans
    // TIDAK perlu token — keamanan via signature key Midtrans
    // =============================================================
    public function webhook(Request $request): JsonResponse
    {
        try {
            // Ambil order_id langsung dari body notifikasi — belum diverifikasi,
            // cuma dipakai untuk tahu transaksi & tenant mana yang bersangkutan,
            // supaya kita tahu server key MANA yang harus dipakai untuk verifikasi.
            $rawOrderId = $request->input('order_id');

            $transaction = Transaction::with('order.tenant')
                ->where('midtrans_order_id', $rawOrderId)
                ->first();

            if (! $transaction) {
                Log::warning('Transaksi tidak ditemukan untuk order_id: ' . $rawOrderId);
                return response()->json(['message' => 'OK'], 200);
                // ↑ Return 200 tetap supaya Midtrans tidak retry webhook
            }

            // Set server key sesuai tenant pemilik transaksi ini SEBELUM
            // verifikasi signature — kalau tenant punya Midtrans sendiri,
            // Midtrans menyegel notifikasi pakai server key tenant itu,
            // bukan server key platform.
            $this->configureServerKeyForTenant($transaction->order?->tenant);

            // Verifikasi bahwa request benar-benar dari Midtrans
            $notification = new Notification();
            // ↑ Midtrans SDK otomatis verifikasi signature key
            // Kalau signature tidak valid → throw exception

            $orderId           = $notification->order_id;
            $transactionStatus = $notification->transaction_status;
            $paymentType       = $notification->payment_type;
            $fraudStatus       = $notification->fraud_status;

            Log::info('Midtrans webhook received', [
                'order_id' => $orderId,
                'status'   => $transactionStatus,
            ]);
            // ↑ Log setiap webhook masuk untuk debugging

            // ===== UPDATE STATUS BERDASARKAN NOTIFIKASI MIDTRANS =====
            DB::transaction(function () use (
                $transaction,
                $transactionStatus,
                $paymentType,
                $fraudStatus,
                $notification
            ) {
                // Refund: transaksi yang sudah settlement TIDAK boleh "balik"
                // jadi pending — kalau tidak, order yang sudah dibayar bisa
                // terlihat belum lunas & stok/laporan jadi tidak konsisten.
                // (Refund penuh masih belum didukung — cukup catat saja.)
                if (in_array($transactionStatus, ['refund', 'partial_refund'])) {
                    Log::warning('Refund webhook untuk ' . $transaction->midtrans_order_id
                        . ' (' . $transactionStatus . ') — status dipertahankan: ' . $transaction->status);
                    return;
                }

                if ($transactionStatus === 'capture') {
                    // Kartu kredit — cek fraud status
                    $status = $fraudStatus === 'accept' ? 'settlement' : 'deny';
                } elseif ($transactionStatus === 'settlement') {
                    // Transfer bank, QRIS, e-wallet — langsung settlement
                    $status = 'settlement';
                } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                    $status = $transactionStatus;
                } else {
                    $status = 'pending';
                }

                // ----- IDEMPOTENSI -----
                // Midtrans bisa mengirim notifikasi yang SAMA lebih dari sekali
                // (duplikat / retry). Kalau status sudah sama, jangan diproses
                // lagi — kalau tidak: struk WA terkirim berkali-kali, stok
                // di-restore dua kali, dan paid_at ter-reset.
                if ($status === $transaction->status) {
                    Log::info('Webhook duplikat diabaikan untuk '
                        . $transaction->midtrans_order_id . ' (status: ' . $status . ')');
                    return;
                }

                // Update data transaksi
                $transaction->update([
                    'status'                   => $status,
                    'payment_method'           => $paymentType,
                    'midtrans_transaction_id'  => $notification->transaction_id,
                    'paid_at'                  => $status === 'settlement' ? now() : null,
                    'midtrans_response'        => $notification->getResponse(),
                    // ↑ Simpan raw response untuk keperluan debug
                ]);

                // Kalau pembayaran sukses, update status order jadi paid
                // (guard: cek order belum paid — mencegah struk WA ganda)
                if ($status === 'settlement' && $transaction->order->status !== 'paid') {
                    $transaction->order->update(['status' => 'paid']);
                    Log::info('Order ' . $transaction->order->order_number . ' berhasil dibayar.');
                    // Kirim struk digital ke WhatsApp secara ASYNC (queue job)
                    // supaya webhook Midtrans balas 200 cepat, tidak menunggu
                    // waktu respons API Fonnte.
                    \App\Jobs\SendWhatsAppReceipt::dispatch($transaction->order_id);
                }

                // Kalau gagal/expire, kembalikan stok dan cancel order
                // (guard: cek order belum cancelled — mencegah stok kembung
                // kalau order sudah dibatalkan lewat jalur lain sebelumnya)
                if (in_array($status, ['cancel', 'deny', 'expire']) && $transaction->order->status !== 'cancelled') {
                    foreach ($transaction->order->items as $item) {
                        $beforeStock = $item->product->stock;
                        $item->product->increment('stock', $item->quantity);
                        // ↑ Kembalikan stok yang tadi sudah dikurangi saat order dibuat
                        \App\Services\InventoryService::record(
                            $item->product_id,
                            $transaction->order->tenant_id,
                            'cancel',
                            $item->quantity,
                            $beforeStock,
                            $beforeStock + $item->quantity,
                            'transaction',
                            $transaction->id
                        );
                    }
                    $transaction->order->update(['status' => 'cancelled']);
                    Log::info('Order ' . $transaction->order->order_number . ' dibatalkan, stok dikembalikan.');
                }
            });

            return response()->json(['message' => 'OK'], 200);
            // ↑ Midtrans butuh response 200 sebagai konfirmasi webhook diterima
            // Kalau tidak 200, Midtrans akan retry kirim webhook sampai 5x

        } catch (\Exception $e) {
            Log::error('Midtrans webhook error: ' . $e->getMessage());
            return response()->json(['message' => 'Error'], 500);
        }
    }

    // =============================================================
    // HELPER — format data transaksi untuk response
    // =============================================================
    private function formatTransaction(Transaction $transaction): array
    {
        $order = $transaction->relationLoaded('order') ? $transaction->order : null;

        return [
            'id'                      => $transaction->id,
            'order_id'                => $transaction->order_id,
            'midtrans_order_id'       => $transaction->midtrans_order_id,
            'midtrans_transaction_id' => $transaction->midtrans_transaction_id,
            'payment_method'          => $transaction->payment_method,
            'status'                  => $transaction->status,
            'amount'                  => $transaction->amount,
            'snap_token'              => $transaction->snap_token,
            'paid_at'                 => $transaction->paid_at?->format('d M Y H:i'),
            'order'                   => $order ? [
                'id'           => $order->id,
                'order_number' => $order->order_number,
                'status'       => $order->status,
                'subtotal'     => $order->subtotal,
                'tax'          => $order->tax,
                'total'        => $order->total,
                'notes'        => $order->notes,
                'user'         => $order->relationLoaded('user') ? [
                    'id'   => $order->user->id,
                    'name' => $order->user->name,
                ] : null,
                'items'        => $order->relationLoaded('items')
                    ? $order->items->map(fn($item) => [
                        'product_name' => $item->product?->name ?? '-',
                        'quantity'     => $item->quantity,
                        'price'        => $item->price,
                        'subtotal'     => $item->subtotal,
                    ])
                    : null,
            ] : null,
            'created_at' => $transaction->created_at->format('d M Y H:i'),
        ];
    }
}
