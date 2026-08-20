<?php

namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;

/**
 * Forecast penjualan deterministik (tanpa LLM).
 *
 * Pendekatan: rata-rata pendapatan per HARI dalam sepekan (day-of-week),
 * dihitung dari 35 hari terakhir. Hari Senin kemarin yang sepi → Senin
 * depan diprediksi juga sepi. Ini menangkap siklus mingguan tanpa perlu
 * model ML yang rumit.
 */
class ForecastService
{
    /**
     * Prediksi pendapatan untuk N hari ke depan untuk satu tenant.
     *
     * Metode: rata-rata revenue per hari-dalam-sepekan (day-of-week) dari
     * 35 hari terakhir; hari tanpa transaksi ikut dihitung sebagai 0.
     * Kalau suatu day-of-week belum punya data (avg = 0), fallback ke
     * rata-rata keseluruhan. Tingkat keyakinan ditentukan dari banyaknya
     * hari yang punya data penjualan.
     *
     * @param int $tenantId Tenant yang diprediksi
     * @param int $days     Jumlah hari prediksi ke depan (default 7)
     * @return array{period_start: string, period_end: string, days: array, total: int, confidence: string, based_on_days: int}
     */
    public static function forecastForTenant(?int $tenantId, int $days = 7): array
    {
        // Jendela data: 35 hari terakhir (hari ini + 34 hari ke belakang)
        $start = now()->subDays(34)->startOfDay();

        // Revenue per tanggal (hanya order berstatus paid), key = tanggal 'Y-m-d'
        $revenueByDate = Order::query()
            ->when($tenantId, fn($q) => $q->where('tenant_id', $tenantId))
            ->where('status', 'paid')
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as d, SUM(total) as revenue')
            ->groupBy('d')
            ->pluck('revenue', 'd');

        // Berapa lama toko sudah aktif (hari sejak order pertama), dibatasi 1..35.
        // Dipakai sebagai penyebut rata-rata supaya hari tanpa penjualan ikut terhitung.
        $firstOrder = Order::query()
            ->when($tenantId, fn($q) => $q->where('tenant_id', $tenantId))
            ->where('status', 'paid')
            ->min('created_at');
        $daysActive = $firstOrder ? max(1, (int) Carbon::parse($firstOrder)->startOfDay()->diffInDays(now()->startOfDay()) + 1) : 1;
        $daysActive = min(35, $daysActive);

        // Jumlah hari tiap day-of-week di dalam jendela aktif
        // (Carbon: 0 = Minggu .. 6 = Sabtu) — penyebut rata-rata per hari-of-week
        $weekdayCount = array_fill(0, 7, 0);
        for ($i = 0; $i < $daysActive; $i++) {
            $weekday = now()->subDays($i)->dayOfWeek;
            $weekdayCount[$weekday]++;
        }

        // Kumpulkan revenue per hari-dalam-seminggu
        $perWeekday = array_fill(0, 7, []);
        foreach ($revenueByDate as $date => $revenue) {
            $weekday = (int) Carbon::parse($date)->dayOfWeek;
            $perWeekday[$weekday][] = (float) $revenue;
        }

        // Rata-rata revenue per day-of-week (dibagi jumlah hari aktif pada hari itu)
        $weekdayAvg = [];
        foreach ($perWeekday as $weekday => $revenues) {
            $count = $weekdayCount[$weekday];
            $weekdayAvg[$weekday] = $count > 0 ? array_sum($revenues) / $count : 0;
        }

        // Rata-rata keseluruhan — fallback untuk day-of-week yang tidak punya data
        $totalRevenue = array_sum($revenueByDate->values()->all());
        $overallAvg   = $totalRevenue / $daysActive;

        // Prediksi: day-of-week dengan rata-rata dipakai avg-nya, sisanya overall avg
        $forecast = [];
        for ($i = 1; $i <= $days; $i++) {
            $date      = now()->addDays($i);
            $weekday   = (int) $date->dayOfWeek;
            $predicted = $weekdayAvg[$weekday] > 0 ? $weekdayAvg[$weekday] : $overallAvg;

            $forecast[] = [
                'date'      => $date->toDateString(),
                'weekday'   => $date->locale('id')->isoFormat('dddd'),
                'predicted' => (int) round($predicted),
            ];
        }

        // Tingkat keyakinan berdasarkan banyaknya hari yang punya data penjualan
        $daysWithData = count($revenueByDate);

        return [
            'period_start'  => now()->addDays(1)->toDateString(),
            'period_end'    => now()->addDays($days)->toDateString(),
            'days'          => $forecast,
            'total'         => (int) round(array_sum(array_column($forecast, 'predicted'))),
            'confidence'    => $daysWithData >= 21 ? 'tinggi' : ($daysWithData >= 10 ? 'sedang' : 'rendah'),
            'based_on_days' => $daysWithData,
        ];
    }
}
