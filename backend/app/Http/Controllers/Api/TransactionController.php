<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Transaction;
use App\Services\WhatsAppService;
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
        // Setup konfigurasi Midtrans
        Config::$serverKey    = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized  = true;
        Config::$is3ds        = true;

        // Override notification URL — dipakai saat development dengan ngrok
        // Di production, hapus MIDTRANS_NOTIFICATION_URL dari .env agar pakai URL dari dashboard
        $notifUrl = config('services.midtrans.notification_url');
        if ($notifUrl) {
            Config::$overrideNotifUrl = $notifUrl;
        }
    }

    // =============================================================
    // INDEX — ambil semua transaksi (admin & kasir)
    // GET /api/transactions
    // =============================================================
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with('order.user')
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
    // SHOW — detail satu transaksi
    // GET /api/transactions/{id}
    // =============================================================
    public function show(Request $request, int $id): JsonResponse
    {
        $transaction = Transaction::with('order.user')->find($id);

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
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
        ]);

        $order = Order::with(['user', 'items.product'])->find($validated['order_id']);

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
    // WEBHOOK — dipanggil otomatis oleh server Midtrans
    // POST /api/webhook/midtrans
    // TIDAK perlu token — keamanan via signature key Midtrans
    // =============================================================
    public function webhook(Request $request): JsonResponse
    {
        try {
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

            // Cari transaksi berdasarkan midtrans_order_id
            $transaction = Transaction::where('midtrans_order_id', $orderId)->first();

            if (! $transaction) {
                Log::warning('Transaksi tidak ditemukan untuk order_id: ' . $orderId);
                return response()->json(['message' => 'OK'], 200);
                // ↑ Return 200 tetap supaya Midtrans tidak retry webhook
            }

            // ===== UPDATE STATUS BERDASARKAN NOTIFIKASI MIDTRANS =====
            DB::transaction(function () use (
                $transaction,
                $transactionStatus,
                $paymentType,
                $fraudStatus,
                $notification
            ) {
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
                if ($status === 'settlement') {
                    $transaction->order->update(['status' => 'paid']);
                    Log::info('Order ' . $transaction->order->order_number . ' berhasil dibayar.');
                    // Kirim struk digital ke WhatsApp customer (kalau ada nomor HP)
                    $order = $transaction->order->load('items.product');
                    app(WhatsAppService::class)->sendReceipt($order);
                }

                // Kalau gagal/expire, kembalikan stok dan cancel order
                if (in_array($status, ['cancel', 'deny', 'expire'])) {
                    foreach ($transaction->order->items as $item) {
                        $item->product->increment('stock', $item->quantity);
                        // ↑ Kembalikan stok yang tadi sudah dikurangi saat order dibuat
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
            'order'                   => $transaction->relationLoaded('order') ? [
                'id'           => $transaction->order->id,
                'order_number' => $transaction->order->order_number,
                'total'        => $transaction->order->total,
                'user'         => $transaction->order->relationLoaded('user') ? [
                    'id'   => $transaction->order->user->id,
                    'name' => $transaction->order->user->name,
                ] : null,
            ] : null,
            'created_at' => $transaction->created_at->format('d M Y H:i'),
        ];
    }
}
