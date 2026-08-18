<?php

namespace App\Providers;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;

/**
 * AppServiceProvider — registrasi layanan aplikasi.
 *
 * Boot: paksa HTTPS di production (Railway) & daftarkan limiter rate global
 * 'api' yang dipasang di semua route /api/* via bootstrap/app.php.
 */
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Paksa semua URL (termasuk asset/gambar) pakai HTTPS di production
        // Tanpa ini, Railway generate URL http:// → browser blok (Mixed Content)
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        $this->configureRateLimiting();
    }

    /**
     * Rate limiting GLOBAL untuk seluruh route API (dipasang di bootstrap/app.php
     * via `$middleware->throttleApi('api')`).
     *
     * Endpoint khusus di-exempt (Limit::none) supaya tidak merusak:
     *  - webhook Midtrans → dipanggil otomatis server Midtrans, bisa paralel & retry
     *  - media proxy     → browser memuat banyak gambar produk sekaligus saat buka katalog
     *  - polling AI      → frontend mem-poll /ai/jobs/{id} tiap 2 detik
     *                      & sidebar memanggil /ai/usage-today sering; di-design sengaja
     *                      tanpa throttle per-route sebelumnya
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            $path = $request->path(); // contoh: "api/webhook/midtrans"

            // Khusus endpoint yang TIDAK boleh kena throttle global
            if (str_starts_with($path, 'api/webhook/')
                || str_starts_with($path, 'api/media/')
                || str_starts_with($path, 'api/ai/jobs/')
                || $path === 'api/ai/usage-today') {
                return Limit::none();
            }

            // User login → batas per-user (axios pool + POS aktif masih aman)
            if ($request->user()) {
                return Limit::perMinute(120)->by($request->user()->id);
            }

            // Route publik (login/register/check-tenant) → per-IP.
            // Route login/register punya throttle ekstra throttle:5,1 di route.
            return Limit::perMinute(60)->by($request->ip());
        });
    }
}