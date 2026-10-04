<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Akun Developer (satu-satunya)
    |--------------------------------------------------------------------------
    | Hanya SATU email yang boleh berperan "developer" (akses lintas tenant dan
    | Developer Portal). Peran developer pada akun dengan email lain ditolak di
    | seluruh API (middleware single.developer) dan tidak bisa diberikan lewat
    | manajemen user. Ubah lewat env DEVELOPER_EMAIL kalau pemilik berganti.
    */
    'developer_email' => env('DEVELOPER_EMAIL', 'donojomi@gmail.com'),

    /*
    |--------------------------------------------------------------------------
    | Masa tenggang langganan
    |--------------------------------------------------------------------------
    | Berapa hari paket berbayar tetap aktif setelah `expires_at` sebelum
    | diturunkan ke Free oleh `php artisan subscriptions:expire` (dijadwalkan
    | tiap jam). 0 = turun segera setelah berakhir.
    */
    'subscription_grace_days' => (int) env('SUBSCRIPTION_GRACE_DAYS', 3),

];
