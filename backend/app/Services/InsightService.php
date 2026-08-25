<?php

namespace App\Services;

use App\Models\AiInsight;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

/**
 * Generator AI Business Insight.
 *
 * Prinsip (sesuai roadmap): SEMUA angka dihitung di server (SQL deterministik,
 * bukan ditebak AI). AI hanya "merangkai kalimat" dari angka-angka itu supaya
 * pemilik toko langsung paham tanpa baca tabel. Kalau LLM gagal/offline,
 * ada fallback templated dari data yang sama, insight tetap muncul.
 */
class InsightService
{
    /**
     * Generate ulang insight minggu berjalan untuk satu tenant.
     *
     * Alur: hitung metrik deterministik → narasi AI (fallback templated) →
     * hapus insight lama tenant → simpan yang baru. Satu bundle insight
     * mencakup periode minggu berjalan.
     *
     * @return array<int, AiInsight> Daftar AiInsight yang baru dibuat
     */
    public function generateForTenant(?int $tenantId): array
    {
        $metrics  = $this->computeMetrics($tenantId);
        $insights = $this->narrate($metrics);

        // Regenerate = ganti insight lama tenant ini dengan yang baru
        AiInsight::where('tenant_id', $tenantId)->delete();

        $created = [];
        foreach ($insights as $insight) {
            $created[] = AiInsight::create([
                'tenant_id'    => $tenantId,
                'type'         => $insight['type'] ?? 'sales',
                'title'        => $insight['title'],
                'body'         => $insight['body'],
                'data'         => $insight['data'] ?? null,
                'period_start' => now()->startOfWeek()->toDateString(),
                'period_end'   => now()->endOfWeek()->toDateString(),
            ]);
        }

        return $created;
    }

    // ============================================================
    // Metrik deterministik, hitung dari data nyata, bukan AI.
    // ============================================================
    /**
     * Hitung semua metrik minggu ini dari data nyata (SQL deterministik).
     * Bagian ini TIDAK menyentuh LLM, angka yang sama dipakai baik oleh
     * narasi AI maupun fallback templated.
     */
    private function computeMetrics(?int $tenantId): array
    {
        $weekStart = now()->startOfWeek();

        // ----- Pendapatan minggu ini vs minggu lalu -----
        $revenueThisWeek = (float) Order::where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->whereBetween('created_at', [$weekStart, now()])
            ->sum('total');

        $revenueLastWeek = (float) Order::where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->whereBetween('created_at', [$weekStart->copy()->subWeek(), $weekStart])
            ->sum('total');

        $ordersThisWeek = Order::where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->where('created_at', '>=', $weekStart)
            ->count();

        // ----- Top produk minggu ini -----
        $topProduct = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.status', 'paid')
            ->where('orders.created_at', '>=', $weekStart)
            ->selectRaw('products.name as name, SUM(order_items.quantity) as qty')
            ->groupBy('products.name')
            ->orderByDesc('qty')
            ->first();

        // ----- Kondisi stok -----
        $totalProducts   = Product::where('tenant_id', $tenantId)->count();
        $lowStockCount   = Product::where('tenant_id', $tenantId)->whereColumn('stock', '<=', 'stock_alert')->count();
        $outOfStockCount = Product::where('tenant_id', $tenantId)->where('stock', 0)->count();

        // ----- Customer -----
        $newCustomers = Customer::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $weekStart)
            ->count();

        return [
            'periode'             => $weekStart->locale('id')->isoFormat('D MMMM') . ' - ' . now()->locale('id')->isoFormat('D MMMM'),
            'revenue_minggu_ini'  => (int) $revenueThisWeek,
            'revenue_minggu_lalu' => (int) $revenueLastWeek,
            'perubahan_persen'    => $revenueLastWeek > 0
                ? round((($revenueThisWeek - $revenueLastWeek) / $revenueLastWeek) * 100, 1)
                : null,
            'jumlah_order'        => $ordersThisWeek,
            'rata_nilai_order'    => $ordersThisWeek > 0 ? (int) round($revenueThisWeek / $ordersThisWeek) : 0,
            'produk_terlaris'     => $topProduct ? [
                'nama' => $topProduct->name, 'qty' => (int) $topProduct->qty,
            ] : null,
            'total_produk'        => $totalProducts,
            'stok_menipis'        => $lowStockCount,
            'stok_habis'          => $outOfStockCount,
            'customer_baru'       => $newCustomers,
        ];
    }

    // ============================================================
    // Narasi AI, LLM hanya menulis kalimat dari angka yang sudah
    // dihitung. Kalau gagal → fallback templated.
    // ============================================================
    /**
     * Minta LLM merangkai kalimat insight dari metrik yang sudah dihitung.
     * LLM hanya menulis JSON array {type, title, body}; kalau gagal atau
     * responnya bukan JSON valid → fallback templated (tanpa LLM).
     */
    private function narrate(array $metrics): array
    {
        $systemPrompt = "Kamu adalah analis bisnis KasirAI untuk toko UMKM Indonesia. Semua angka dalam data sudah dihitung akurat oleh server, TUGASMU HANYA merangkai angka-angka itu menjadi insight yang mudah dipahami pemilik toko. JANGAN menambah angka yang tidak ada di data. JANGAN memberi saran generik yang kosong; selalu kaitkan dengan angka.

Aturan:
- Bahasa Indonesia, ringkas, hangat, dan actionable.
- Setiap insight: title (maks 6 kata) + body (2-3 kalimat).
- Stok menipis/habis wajib jadi insight dengan arahan restok.
- Kalau revenue naik/turun signifikan (>10%), jelaskan polanya dari data.
- Jawab HANYA JSON array tanpa teks lain, format:
[{\"type\":\"sales\",\"title\":\"...\",\"body\":\"...\"}, ...]
- 3 sampai 5 item. type harus salah satu: sales, stock, customer.";

        try {
            $result = app(GroqService::class)->ask($systemPrompt, 'Data minggu ini: ' . json_encode($metrics, JSON_UNESCAPED_UNICODE));
            $decoded = json_decode($this->extractJson($result['text'] ?? ''), true);

            if (! is_array($decoded) || count($decoded) === 0) {
                throw new \Exception('Response AI bukan JSON array.');
            }

            return array_slice($decoded, 0, 5);
        } catch (\Throwable $e) {
            Log::warning('Insight AI gagal, memakai fallback templated: ' . $e->getMessage());
            return $this->fallbackInsights($metrics);
        }
    }

    /**
     * Ekstrak bagian JSON array dari teks response AI yang mungkin terbungkus
     * fenced code block atau ada teks lain di sekitarnya.
     */
    private function extractJson(string $text): string
    {
        // Buang fenced code block kalau model membungkus JSON dengan ```json
        $text = preg_replace('/^```(?:json)?\s*/m', '', trim($text));
        $text = preg_replace('/```\s*$/m', '', $text);

        $start = strpos($text, '[');
        $end   = strrpos($text, ']');
        if ($start === false || $end === false || $end <= $start) {
            return $text;
        }
        return substr($text, $start, $end - $start + 1);
    }

    // ============================================================
    // Fallback tanpa LLM, insight tetap muncul walau AI offline.
    // ============================================================
    /**
     * Buat insight tanpa LLM langsung dari metrik (template kalimat).
     * Dipakai kalau AI gagal/offline, supaya insight tetap muncul di dashboard.
     */
    private function fallbackInsights(array $m): array
    {
        $insights = [];

        // Format nominal gaya Indonesia: Rp 1.250.000
        $rupiah = fn($n) => 'Rp ' . number_format($n, 0, ',', '.');

        if ($m['perubahan_persen'] !== null) {
            if ($m['perubahan_persen'] >= 0) {
                $insights[] = [
                    'type'  => 'sales',
                    'title' => "Pendapatan naik {$m['perubahan_persen']}%",
                    'body'  => "Minggu ini kamu membukukan {$rupiah($m['revenue_minggu_ini'])} dari {$m['jumlah_order']} transaksi, naik dari {$rupiah($m['revenue_minggu_lalu'])} minggu lalu.",
                ];
            } else {
                $insights[] = [
                    'type'  => 'sales',
                    'title' => "Pendapatan turun " . abs($m['perubahan_persen']) . "%",
                    'body'  => "Minggu ini {$rupiah($m['revenue_minggu_ini'])} dari {$m['jumlah_order']} transaksi, lebih rendah dari {$rupiah($m['revenue_minggu_lalu'])} minggu lalu. Cek hari mana yang paling sepi di laporan.",
                ];
            }
        }

        if ($m['produk_terlaris']) {
            $insights[] = [
                'type'  => 'sales',
                'title' => "Produk terlaris: {$m['produk_terlaris']['nama']}",
                'body'  => "\"{$m['produk_terlaris']['nama']}\" terjual {$m['produk_terlaris']['qty']} pcs minggu ini. Pertimbangkan stok ekstra dan jadikan produk ini andalan promosi.",
            ];
        }

        if ($m['stok_menipis'] > 0 || $m['stok_habis'] > 0) {
            $insights[] = [
                'type'  => 'stock',
                'title' => "{$m['stok_menipis']} produk stok menipis, {$m['stok_habis']} habis",
                'body'  => "Dari {$m['total_produk']} produk, {$m['stok_habis']} sudah habis dan {$m['stok_menipis']} mendekati batas. Segera restok lewat halaman Produk agar penjualan tidak terhambat.",
            ];
        }

        if ($m['customer_baru'] > 0) {
            $insights[] = [
                'type'  => 'customer',
                'title' => "{$m['customer_baru']} pelanggan baru minggu ini",
                'body'  => "Ada {$m['customer_baru']} pembeli baru yang terdata minggu ini. Pertahankan dengan layanan yang baik, pelanggan yang puas biasanya belanja lagi.",
            ];
        }

        if (count($insights) === 0) {
            $insights[] = [
                'type'  => 'sales',
                'title' => 'Belum ada cukup data',
                'body'  => 'Catat beberapa transaksi dulu, nanti KasirAI bisa memberimu wawasan otomatis soal penjualan, stok, dan pelanggan.',
            ];
        }

        return $insights;
    }
}
