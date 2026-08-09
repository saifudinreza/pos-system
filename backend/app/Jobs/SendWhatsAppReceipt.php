<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendWhatsAppReceipt implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $maxExceptions = 1;
    public array $backoff = [5, 15, 60];

    private int $orderId;

    public function __construct(int $orderId)
    {
        $this->orderId = $orderId;
    }

    public function getOrderId(): int
    {
        return $this->orderId;
    }

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