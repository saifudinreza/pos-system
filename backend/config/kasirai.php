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

];
