<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Turunkan paket ke Free untuk langganan yang sudah lewat masa berlaku + tenggang.
// Dijalankan oleh `php artisan schedule:work` (lihat entrypoint.sh).
Schedule::command('subscriptions:expire')->hourly()->withoutOverlapping();
