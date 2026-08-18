<?php

namespace App\Services;

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
     * @param Order $order Order yang sudah lunas (dengan relasi items.product)
     * @return bool true kalau berhasil kirim, false kalau gagal/tidak dikonfigurasi
     */
    public function sendReceipt(Order $order): bool
    {
        // Jangan kirim kalau tidak ada nomor HP atau token belum dikonfigurasi
        if (! $order->customer_phone || ! $this->token) {
            return false;
        }

        $message = $this->buildReceiptMessage($order);

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post($this->apiUrl, [
                // Nomor dinormalisasi ke format internasional (62...) — lihat formatPhone()
                'target'      => $this->formatPhone($order->customer_phone),
                'message'     => $message,
                'countryCode' => '62',   // Indonesia
            ]);

            if ($response->successful()) {
                Log::info("Struk WA terkirim ke {$order->customer_phone} untuk order {$order->order_number}");
                return true;
            }

            Log::warning("Gagal kirim struk WA: " . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::error("WhatsApp error: " . $e->getMessage());
            return false;
        }
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
