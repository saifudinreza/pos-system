<?php

namespace App\Console\Commands;

use App\Mail\SubscriptionReminderMail;
use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Kirim email pengingat sebelum langganan berbayar berakhir.
 *
 * Tahap pengingat (config kasirai.subscription_reminder_days, default 7, 3, 1)
 * ditambah tahap 0 = sudah lewat expires_at tetapi masih masa tenggang.
 * `subscriptions.last_reminder_days` mencatat tahap terakhir yang terkirim,
 * jadi tiap tahap dikirim paling banyak sekali per langganan, dan perintah
 * aman dijalankan berulang.
 */
class RemindSubscriptions extends Command
{
    protected $signature = 'subscriptions:remind {--dry-run : Tampilkan saja, tanpa mengirim email}';

    protected $description = 'Kirim email pengingat sebelum langganan berakhir.';

    public function handle(): int
    {
        $stages = collect(config('kasirai.subscription_reminder_days', [7, 3, 1]))
            ->map(fn ($d) => (int) $d)->filter(fn ($d) => $d > 0)->sort()->values();
        $maxDays = (int) $stages->max();
        $grace   = max(0, (int) config('kasirai.subscription_grace_days', 3));
        $dryRun  = (bool) $this->option('dry-run');

        if ($stages->isEmpty()) {
            $this->info('Tidak ada tahap pengingat yang diatur.');
            return self::SUCCESS;
        }

        // Langganan aktif yang berakhir dalam jendela pengingat (atau baru lewat, masih tenggang)
        $subs = Subscription::with('user')
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now()->addDays($maxDays))
            ->where('expires_at', '>=', now()->subDays($grace))
            ->get();

        $sent = 0;

        foreach ($subs as $sub) {
            $user = $sub->user;
            if (! $user || ! $user->email || ! $user->is_active) {
                continue;
            }

            $stage = $this->stageFor($sub, $stages);

            // Sudah pernah dikirim untuk tahap ini (atau tahap yang lebih dekat)
            if ($sub->last_reminder_days !== null && $sub->last_reminder_days <= $stage) {
                continue;
            }

            if ($dryRun) {
                $this->line("[dry-run] {$user->email}: paket {$sub->plan}, tahap {$stage} hari");
                continue;
            }

            Mail::to($user)->send(new SubscriptionReminderMail($sub, $stage, $grace));
            $sub->update(['last_reminder_days' => $stage]);
            $sent++;
        }

        $this->info($dryRun ? 'Dry-run selesai, tidak ada email dikirim.' : "{$sent} email pengingat dikirim.");

        return self::SUCCESS;
    }

    /** Tahap pengingat terdekat yang sudah tercapai: 0 kalau sudah lewat expires_at. */
    private function stageFor(Subscription $sub, $stages): int
    {
        if ($sub->expires_at->isPast()) {
            return 0;
        }

        $daysLeft = (int) ceil(now()->floatDiffInDays($sub->expires_at));

        return (int) $stages->first(fn ($s) => $daysLeft <= $s);
    }
}
