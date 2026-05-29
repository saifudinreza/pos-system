<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

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
    }
}
