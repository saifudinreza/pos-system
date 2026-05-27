<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// ============================================================
// WhatsAppService — Kirim struk digital ke WhatsApp customer
//
// Menggunakan Fonnte API (fonnte.com):
//   POST https://api.fonnte.com/send
//   Header: Authorization: <token>
//   Body:   { target, message, countryCode }
//
// Cara dapat token Fonnte:
//   1. Daftar di fonnte.com
//   2. Tambah device (scan QR dengan WA kamu)
//   3. Copy token dari dashboard
//   4. Isi FONNTE_TOKEN di .env backend
// ============================================================
class WhatsAppService
{
    private string $token;
    private string $apiUrl = 'https://api.fonnte.com/send';

    public function __construct()
    {
        $this->token = config('services.fonnte.token', '');
    }

    // =============================================================
    // sendReceipt — Kirim struk pembayaran ke nomor WA customer
    //
    // @param Order $order  — order yang sudah lunas (dengan relasi items.product)
    // @return bool          — true kalau berhasil kirim, false kalau gagal/tidak dikonfigurasi
    // =============================================================
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

    // =============================================================
    // buildReceiptMessage — Format pesan struk dalam teks WhatsApp
    //
    // WhatsApp mendukung formatting sederhana:
    //   *teks*  = bold
    //   _teks_  = italic
    // =============================================================
    private function buildReceiptMessage(Order $order): string
    {
        $appName  = config('app.name', 'KasirAI');
        $lines    = [];

        $lines[] = "🧾 *STRUK PEMBELIAN*";
        $lines[] = "KasirAI";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "No. Order : *{$order->order_number}*";
        $lines[] = "Tanggal   : {$order->created_at->format('d M Y, H:i')}";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━";

        // Detail item yang dibeli
        foreach ($order->items as $item) {
            $productName = $item->product->name ?? $item->product_name ?? '-';
            $subtotal    = number_format($item->subtotal, 0, ',', '.');
            $price       = number_format($item->price, 0, ',', '.');
            $lines[]     = "▸ {$productName}";
            $lines[]     = "  {$item->quantity} × Rp {$price} = *Rp {$subtotal}*";
        }

        $lines[] = "━━━━━━━━━━━━━━━━━━━━";

        // Ringkasan harga
        $subtotal = number_format($order->subtotal, 0, ',', '.');
        $total    = number_format($order->total,    0, ',', '.');

        $lines[] = "Subtotal  : Rp {$subtotal}";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "*TOTAL    : Rp {$total}*";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "✅ Pembayaran *LUNAS*";
        $lines[] = "";
        $lines[] = "Terima kasih sudah berbelanja! 🙏";
        $lines[] = "_Powered by KasirAI";

        return implode("\n", $lines);
    }

    // =============================================================
    // formatPhone — Normalisasi nomor HP ke format internasional
    //
    // Contoh:
    //   "08123456789"  → "628123456789"
    //   "8123456789"   → "628123456789"
    //   "628123456789" → "628123456789" (sudah benar)
    //   "+628123456789"→ "628123456789" (hapus tanda +)
    // =============================================================
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
