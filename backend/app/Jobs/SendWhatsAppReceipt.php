<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Job kirim struk digital via WhatsApp (async).
 *
 * Di-dispatch dari webhook Midtrans (TransactionController::webhook()) dan
 * OrderController::updateStatus() supaya respons HTTP cepat tanpa menunggu
 * API Fonnte. Retry 3× dengan backoff [5, 15, 60] detik.
 */
class SendWhatsAppReceipt implements ShouldQueue
{
    use Queueable;

    /** Jumlah maksimal percobaan kirim struk (retry otomatis oleh queue). */
    public int $tries = 3;
    /** Hentikan retry setelah 1 exception non-transient. */
    public int $maxExceptions = 1;
    /** Delay antar retry (detik): 5s → 15s → 60s. */
    public array $backoff = [5, 15, 60];

    /** ID order yang struknya akan dikirim. */
    private int $orderId;

    /**
     * @param int $orderId ID order tujuan kirim struk
     */
    public function __construct(int $orderId)
    {
        $this->orderId = $orderId;
    }

    /**
     * Ambil ID order yang dikirim (dipakai test QueueJobTest).
     */
    public function getOrderId(): int
    {
        return $this->orderId;
    }

    /**
     * Kirim struk WhatsApp untuk order terkait.
     */
    public function handle(WhatsAppService $whatsapp): void
    {
        // Muat ulang order di dalam job supaya data selalu fresh (relatif
        // terhadap saat job dieksekusi, bukan saat order dibuat). Kalau order
        // sudah terhapus/dibatalkan, tidak perlu kirim apa-apa.
        $order = Order::with(['tenant', 'user', 'items.product', 'transaction'])
            ->find($this->orderId);

        if (! $order) {
            return;
        }

        $whatsapp->sendReceipt($order);
    }
}