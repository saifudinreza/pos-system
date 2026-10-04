<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Turunkan paket ke Free saat langganan berbayar berakhir.
 *
 * Sumber kebenaran masa berlaku adalah `subscriptions.expires_at` (diisi webhook
 * Midtrans). Langganan 'active' yang lewat expires_at + masa tenggang ditandai
 * 'expired'; kalau pemiliknya tak punya langganan aktif lain, `subscription_plan`
 * pemilik dan seluruh user di tenant yang sama kembali ke 'free'.
 *
 * Akun tanpa baris langganan (paket diberikan manual lewat panel developer)
 * tidak tersentuh, karena yang diproses hanya langganan yang kedaluwarsa.
 */
class ExpireSubscriptions extends Command
{
    protected $signature = 'subscriptions:expire {--dry-run : Tampilkan saja, tanpa mengubah data}';

    protected $description = 'Turunkan paket ke Free untuk langganan yang sudah berakhir (setelah masa tenggang).';

    public function handle(): int
    {
        $grace  = max(0, (int) config('kasirai.subscription_grace_days', 3));
        $cutoff = now()->subDays($grace);
        $dryRun = (bool) $this->option('dry-run');

        $expired = Subscription::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', $cutoff)
            ->get();

        if ($expired->isEmpty()) {
            $this->info('Tidak ada langganan yang perlu diturunkan.');
            return self::SUCCESS;
        }

        $downgraded = 0;

        foreach ($expired->groupBy('user_id') as $userId => $subs) {
            $user = User::withoutGlobalScopes()->find($userId);

            if ($dryRun) {
                $this->line("[dry-run] user #{$userId} ({$user?->email}): {$subs->count()} langganan berakhir");
                continue;
            }

            DB::transaction(function () use ($subs, $user, $userId, $cutoff, &$downgraded) {
                Subscription::whereIn('id', $subs->pluck('id'))->update(['status' => 'expired']);

                if (! $user || $user->role === 'developer') {
                    return;
                }

                // Masih ada langganan aktif lain yang belum lewat tenggang? Ikuti paket itu.
                $remaining = Subscription::where('user_id', $userId)
                    ->where('status', 'active')
                    ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', $cutoff))
                    ->latest('paid_at')
                    ->first();

                $newPlan = $remaining?->plan ?? 'free';

                $user->update(['subscription_plan' => $newPlan]);

                // Sinkron ke user lain di tenant yang sama (sama seperti saat upgrade).
                // tenant_id null dilewati agar tidak menyentuh semua user tanpa tenant.
                if ($user->tenant_id !== null) {
                    User::withoutGlobalScopes()
                        ->where('tenant_id', $user->tenant_id)
                        ->where('id', '!=', $user->id)
                        ->update(['subscription_plan' => $newPlan]);
                }

                $downgraded++;
                Log::info("Subscription expired: user_id={$userId} plan_baru={$newPlan}");
            });
        }

        $this->info($dryRun
            ? 'Dry-run selesai, tidak ada data yang diubah.'
            : "{$downgraded} akun diperbarui dari {$expired->count()} langganan yang berakhir.");

        return self::SUCCESS;
    }
}
