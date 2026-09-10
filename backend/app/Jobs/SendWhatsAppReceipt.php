<?php

namespace App\Jobs;

use App\Exceptions\FonnteApiException;
use App\Exceptions\FonnteNetworkException;
use App\Exceptions\FonnteNotConfiguredException;
use App\Models\Order;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

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
     *
     * Retry logic:
     * - FonnteNotConfiguredException: NON-retryable → log & jangan re-throw (job selesai, tidak retry)
     * - FonnteApiException: retry HANYA kalau isRetryable() (429/5xx) → biarkan bubble up ke Laravel queue
     * - FonnteNetworkException: TRANSIENT → biarkan bubble up ke Laravel queue (retry otomatis)
     *
     * Laravel queue akan retry sampai $tries (3×) dengan $backoff [5,15,60] untuk exception yang di-throw.
     */
    public function handle(WhatsAppService $whatsapp): void
    {
        $order = Order::with(['tenant', 'user', 'items.product', 'transaction'])
            ->find($this->orderId);

        if (! $order) {
            return;
        }

        try {
            $whatsapp->sendReceipt($order);

        } catch (FonnteNotConfiguredException $e) {
            // Token belum dikonfigurasi — non-retryable, jangan re-throw.
            // Job dianggap selesai (success) tapi struk tidak terkirim.
            Log::warning("WhatsApp struk tidak terkirim (token belum dikonfigurasi): order {$order->order_number}");
            return;

        } catch (FonnteApiException $e) {
            if (! $e->isRetryable()) {
                // Non-retryable API error (401, 403, 404, dll) — log & jangan re-throw
                Log::warning("WhatsApp API error (non-retryable): {$e->getMessage()} | order {$order->order_number}");
                return;
            }
            // Retryable (429/5xx) — biarkan bubble up, Laravel queue akan retry
            throw $e;

        } catch (FonnteNetworkException $e) {
            // Network error — transient, biarkan bubble up, Laravel queue akan retry
            throw $e;
        }
    }
}