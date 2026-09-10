<?php

namespace App\Services;

use App\Exceptions\FonnteApiException;
use App\Exceptions\FonnteNetworkException;
use App\Exceptions\FonnteNotConfiguredException;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Pengiriman struk digital ke WhatsApp customer lewat Fonnte API.
 *
 * API Fonnte (fonnte.com):
 *   POST https://api.fonnte.com/send
 *   Header: Authorization: <token>
 *   Body:   { target, message, countryCode }
 *
 * Cara dapat token Fonnte:
 *   1. Daftar di fonnte.com
 *   2. Tambah device (scan QR dengan WA kamu)
 *   3. Copy token dari dashboard
 *   4. Isi FONNTE_TOKEN di .env backend
 */
class WhatsAppService
{
    private string $token;
    private string $apiUrl = 'https://api.fonnte.com/send';

    public function __construct()
    {
        $this->token = config('services.fonnte.token', '');
    }

    /**
     * Kirim struk pembayaran ke nomor WA customer.
     *
     * Exception di-lewatkan ke caller (queue job) supaya Laravel queue
     * bisa handle retry otomatis via $tries & $backoff.
     *
     * @param Order $order Order yang sudah lunas (dengan relasi items.product)
     * @throws FonnteNotConfiguredException Token Fonnte belum diset (non-retryable)
     * @throws FonnteApiException Fonnte API error 4xx/5xx (retry kalau 429/5xx)
     * @throws FonnteNetworkException Network error timeout/DNS/TLS (retryable)
     */
    public function sendReceipt(Order $order): void
    {
        // Jangan kirim kalau tidak ada nomor HP
        if (! $order->customer_phone) {
            return;
        }

        // Token tidak dikonfigurasi = error non-transient, jangan retry
        if (! $this->token) {
            throw new FonnteNotConfiguredException();
        }

        $message = $this->buildReceiptMessage($order);

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post($this->apiUrl, [
                'target'      => $this->formatPhone($order->customer_phone),
                'message'     => $message,
                'countryCode' => '62',
            ]);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            // Network error (timeout, DNS, TLS) — wrap ke exception kita supaya job bisa catch
            throw new FonnteNetworkException('Gagal terhubung ke Fonnte API: ' . $e->getMessage(), 0, $e);
        }

        if ($response->successful()) {
            Log::info("Struk WA terkirim ke {$order->customer_phone} untuk order {$order->order_number}");
            return;
        }

        // Fonnte API return error response (4xx/5xx)
        $responseBody = $response->json() ?? ['raw' => $response->body()];
        throw new FonnteApiException(
            "Gagal kirim struk WA: " . ($responseBody['message'] ?? $response->body()),
            $response->status(),
            $responseBody
        );
    }

    /**
     * Susun isi pesan struk dalam format teks WhatsApp.
     *
     * Formatting WA yang dipakai: *teks* = bold, _teks_ = italic.
     * Nominal diformat gaya Indonesia (Rp 1.250.000) tanpa desimal.
     */
    private function buildReceiptMessage(Order $order): string
    {
        $storeName = $order->tenant?->name ?? config('app.name', 'KasirAI');
        $cashier   = $order->user?->name ?? '-';
        $paymentMethod = $this->paymentMethodLabel($order->transaction?->payment_method);

        $lines = [];

        $lines[] = "*{$storeName}*";
        $lines[] = "Struk Pembelian";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "No. Order  : *{$order->order_number}*";
        $lines[] = "Tanggal    : {$order->created_at->format('d M Y, H:i')}";
        $lines[] = "Kasir      : {$cashier}";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━";

        // Detail item yang dibeli
        foreach ($order->items as $item) {
            $productName = $item->product->name ?? $item->product_name ?? '-';
            $subtotal    = number_format($item->subtotal, 0, ',', '.');
            $price       = number_format($item->price, 0, ',', '.');
            $lines[]     = $productName;
            $lines[]     = "  {$item->quantity} x Rp {$price} = Rp {$subtotal}";
        }

        $lines[] = "━━━━━━━━━━━━━━━━━━━━";

        // Ringkasan harga
        $subtotal = number_format($order->subtotal, 0, ',', '.');
        $tax      = number_format($order->tax ?? 0, 0, ',', '.');
        $total    = number_format($order->total,    0, ',', '.');

        $lines[] = "Subtotal    : Rp {$subtotal}";
        $lines[] = "PPN 11%     : Rp {$tax}";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "*TOTAL*      : *Rp {$total}*";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "Pembayaran  : {$paymentMethod} (Lunas)";
        $lines[] = "";
        $lines[] = "Terima kasih sudah berbelanja di {$storeName}.";
        $lines[] = "Sampai jumpa lagi!";
        $lines[] = "_Powered by KasirAI_";

        return implode("\n", $lines);
    }

    /**
     * Terjemahkan kode metode bayar internal ke label ramah-customer
     * yang ditampilkan di isi struk (default: Tunai).
     */
    private function paymentMethodLabel(?string $method): string
    {
        return match ($method) {
            'cash'          => 'Tunai',
            'qris'          => 'QRIS',
            'bank_transfer' => 'Transfer Bank',
            'credit_card'   => 'Kartu Kredit',
            'other'         => 'Lainnya',
            default         => 'Tunai',
        };
    }

    /**
     * Normalisasi nomor HP ke format internasional Indonesia (62...).
     *
     * Contoh:
     *   "08123456789"   → "628123456789"
     *   "8123456789"    → "628123456789"
     *   "628123456789"  → "628123456789" (sudah benar)
     *   "+628123456789" → "628123456789" (hapus tanda +)
     */
    private function formatPhone(string $phone): string
    {
        // Hapus semua karakter non-digit
        $phone = preg_replace('/\D/', '', $phone);

        // Ganti awalan 0 atau tidak ada kode negara dengan 62
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (! str_starts_with($phone, '62')) {
            $phone = '62' . $phone;
        }

        return $phone;
    }
}
