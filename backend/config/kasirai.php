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

    /*
    |--------------------------------------------------------------------------
    | Pengingat langganan & email dukungan
    |--------------------------------------------------------------------------
    | Email pengingat dikirim (subscriptions:remind) saat sisa masa berlaku
    | mencapai tiap angka hari di bawah, dan sekali lagi saat sudah berakhir.
    | Pengirim memakai MAIL_FROM_ADDRESS (Resend, domain terverifikasi); alamat
    | dukungan ini dipasang sebagai Reply-To dan dicantumkan di isi email.
    | Jangan jadikan alamat Gmail sebagai pengirim: tidak terverifikasi di
    | Resend dan SMTP keluar diblokir di Render.
    */
    'subscription_reminder_days' => array_map('intval', explode(',', (string) env('SUBSCRIPTION_REMINDER_DAYS', '7,3,1'))),
    'support_email' => env('SUPPORT_EMAIL', 'sikasirai0@gmail.com'),

];
