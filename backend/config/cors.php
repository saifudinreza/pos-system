<?php

// CORS — mengizinkan request dari frontend (Vercel) ke backend (Railway)
// Tanpa ini, browser memblok semua request cross-origin (beda domain)
return [
    // Endpoint yang dikenai CORS policy
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Method HTTP yang diizinkan
    'allowed_methods' => ['*'],

    // Domain frontend yang boleh akses API ini
    // Tambahkan domain Vercel kamu di sini
    'allowed_origins' => [
        'http://localhost:3000',
        'https://kasirai.vercel.app',
        'https://pos-system-seven-rose.vercel.app',
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'allowed_origins_patterns' => [
        // Izinkan semua preview deployment Vercel
        '#^https://.*\.vercel\.app$#',
    ],

    // Header yang boleh dikirim client
    'allowed_headers' => ['*'],

    // Header yang boleh dibaca oleh client dari response
    'exposed_headers' => [],

    // Cache preflight response selama 1 hari (performa)
    'max_age' => 86400,

    // false: tidak pakai cookie/session (kita pakai token Bearer)
    'supports_credentials' => false,
];
