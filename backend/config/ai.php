<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Monthly Request Limit — Paket FREE
    |--------------------------------------------------------------------------
    | Jumlah maksimum prompt AI yang boleh dilakukan satu user paket FREE
    | per bulan (dihitung per bulan kalender). Paket Pro & Enterprise
    | tidak terbatas. Atur via AI_FREE_MONTHLY_LIMIT di .env
    */
    'free_monthly_limit' => (int) env('AI_FREE_MONTHLY_LIMIT', 5),

    /*
    |--------------------------------------------------------------------------
    | AI Daily Request Limit — Paket Pro & Enterprise
    |--------------------------------------------------------------------------
    | Jumlah maksimum prompt AI per HARI (per user) untuk paket berbayar.
    | Free tidak memakai ini (tetap pakai kuota bulanan di atas).
    | Atur via PRO_DAILY_LIMIT / ENTERPRISE_DAILY_LIMIT di .env
    */
    'pro_daily_limit'        => (int) env('PRO_DAILY_LIMIT', 10),
    'enterprise_daily_limit' => (int) env('ENTERPRISE_DAILY_LIMIT', 50),

    /*
    |--------------------------------------------------------------------------
    | Warning Threshold (persentase)
    |--------------------------------------------------------------------------
    | Persentase sisa kuota di mana user mulai mendapat peringatan.
    | Default 30 = warning muncul saat sisa kuota <= 30% dari limit.
    | Contoh: limit=10, threshold=30 → warning saat remaining <= 3
    */
    'warning_threshold_pct' => (int) env('AI_WARNING_THRESHOLD_PCT', 30),

    /*
    |--------------------------------------------------------------------------
    | Token Alert Threshold (per hari, semua user)
    |--------------------------------------------------------------------------
    | Jika total token yang dipakai hari ini melampaui nilai ini,
    | endpoint /api/ai/stats akan memberi flag high_token_usage = true.
    | Berguna untuk monitoring spending di sisi admin.
    */
    'token_alert_threshold' => (int) env('AI_TOKEN_ALERT_THRESHOLD', 50000),
];
