<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Daily Request Limit per User
    |--------------------------------------------------------------------------
    | Jumlah maksimum request AI yang boleh dilakukan satu user per hari.
    | Atur via AI_DAILY_LIMIT di .env
    */
    'daily_limit' => (int) env('AI_DAILY_LIMIT', 10),

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
