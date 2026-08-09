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
    public static function forecastForTenant(int $tenantId, int $days = 7): array
    {
        $start = now()->subDays(34)->startOfDay();
        $rows  = Order::query()
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as d, SUM(total) as revenue')
            ->groupBy('d')
            ->pluck('revenue', 'd');

        // Kumpulkan revenue per hari-dalam-seminggu (Carbon: 0=Minggu .. 6=Sabtu)
        $perWeekday = array_fill(0, 7, []);
        foreach ($rows as $date => $revenue) {
            $weekday = (int) Carbon::parse($date)->dayOfWeek;
            $perWeekday[$weekday][] = (float) $revenue;
        }

        $weekdayAvg = [];
        foreach ($perWeekday as $wd => $revenues) {
            $weekdayAvg[$wd] = count($revenues) ? array_sum($revenues) / count($revenues) : 0;
        }

        $overallAvg = count($rows) ? array_sum($rows->values()->all()) / count($rows) : 0;

        $forecast = [];
        for ($i = 1; $i <= $days; $i++) {
            $date   = now()->addDays($i);
            $wd     = (int) $date->dayOfWeek;
            $pred   = $weekdayAvg[$wd] > 0 ? $weekdayAvg[$wd] : $overallAvg;

            $forecast[] = [
                'date'      => $date->toDateString(),
                'weekday'   => $date->locale('id')->isoFormat('dddd'),
                'predicted' => (int) round($pred),
            ];
        }

        return [
            'period_start'  => now()->addDays(1)->toDateString(),
            'period_end'    => now()->addDays($days)->toDateString(),
            'days'          => $forecast,
            'total'         => (int) round(array_sum(array_column($forecast, 'predicted'))),
            'confidence'    => count($rows) >= 21 ? 'tinggi' : (count($rows) >= 10 ? 'sedang' : 'rendah'),
            'based_on_days' => count($rows),
        ];
    }
}
