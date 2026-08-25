<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands()
    ->withMiddleware(function (Middleware $middleware) {

        // Trust semua proxy (Render, Vercel, Cloudflare, dll)
        // Tanpa ini Laravel tidak tau request datang via HTTPS reverse proxy
        // sehingga asset() generate URL http:// → Mixed Content error di browser
        $middleware->trustProxies(at: '*');

        // CORS: izinkan request cross-origin dari frontend (Vercel → Render)
        // Pakai middleware custom supaya preflight OPTIONS selalu dibalas dengan benar
        $middleware->prepend(\App\Http\Middleware\CorsMiddleware::class);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

        // Rate limiting GLOBAL di semua route /api/*, memakai named limiter 'api'
        // yang didefinisikan di AppServiceProvider::configureRateLimiting().
        // Throttle per-route (login 5,1 / AI 10,1 / insight 5,1) tetap berjalan di atasnya.
        $middleware->throttleApi('api');

    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
