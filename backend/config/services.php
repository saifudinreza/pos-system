<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'groq' => [
        'api_key' => env('GROQ_API_KEY'),
        'model'   => env('GROQ_MODEL', 'openai/gpt-oss-20b'),
    ],

    'openrouter' => [
        'api_key' => env('OPENROUTER_API_KEY'),
        'model'   => env('OPENROUTER_MODEL', 'poolside/laguna-s-2.1:free'),
        'base_url' => 'https://openrouter.ai/api/v1/chat/completions',
    ],

    // Fonnte WA Gateway, untuk kirim struk digital ke WhatsApp customer
    // Daftar di fonnte.com, scan QR dengan WA kamu, copy token ke .env
    'fonnte' => [
        'token' => env('FONNTE_TOKEN', ''),
    ],

    'midtrans' => [
        'server_key'        => env('MIDTRANS_SERVER_KEY'),
        'client_key'        => env('MIDTRANS_CLIENT_KEY'),
        'is_production'     => env('MIDTRANS_IS_PRODUCTION', false),
        'notification_url'  => env('MIDTRANS_NOTIFICATION_URL'),
    ],

    // URL frontend (Next.js), dipakai untuk membangun link reset password
    // yang dikirim lewat email. HARUS diisi di .env production.
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

];
