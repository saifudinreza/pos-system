<?php

namespace Tests\Feature;

use App\Mail\SubscriptionReminderMail;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Email pengingat sebelum langganan berakhir (subscriptions:remind).
 */
class RemindSubscriptionsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $tenant = Tenant::create(['name' => 'Toko A', 'slug' => 'toko-a-' . uniqid()]);

        return User::factory()->create(['tenant_id' => $tenant->id, 'role' => 'admin', 'subscription_plan' => 'pro']);
    }

    private function sub(User $user, $expiresAt, array $extra = []): Subscription
    {
        return Subscription::create(array_merge([
            'user_id'           => $user->id,
            'plan'              => 'pro',
            'billing_cycle'     => 'monthly',
            'amount'            => 129000,
            'status'            => 'active',
            'midtrans_order_id' => 'SUB-' . uniqid(),
            'paid_at'           => now()->subMonth(),
            'expires_at'        => $expiresAt,
        ], $extra));
    }

    public function test_sends_reminder_within_window_and_records_stage(): void
    {
        Mail::fake();
        $user = $this->admin();
        $sub  = $this->sub($user, now()->addDays(6));   // jendela 7 hari

        $this->artisan('subscriptions:remind')->assertExitCode(0);

        Mail::assertQueued(SubscriptionReminderMail::class, fn ($m) => $m->hasTo($user->email) && $m->daysLeft === 7);
        $this->assertSame(7, $sub->fresh()->last_reminder_days);
    }

    public function test_does_not_send_twice_for_same_stage(): void
    {
        Mail::fake();
        $this->sub($this->admin(), now()->addDays(6));

        $this->artisan('subscriptions:remind');
        $this->artisan('subscriptions:remind');

        Mail::assertQueued(SubscriptionReminderMail::class, 1);
    }

    public function test_sends_next_stage_as_expiry_gets_closer(): void
    {
        Mail::fake();
        $sub = $this->sub($this->admin(), now()->addDays(2), ['last_reminder_days' => 7]);

        $this->artisan('subscriptions:remind');

        Mail::assertQueued(SubscriptionReminderMail::class, fn ($m) => $m->daysLeft === 3);
        $this->assertSame(3, $sub->fresh()->last_reminder_days);
    }

    public function test_far_future_subscription_gets_no_reminder(): void
    {
        Mail::fake();
        $this->sub($this->admin(), now()->addDays(20));

        $this->artisan('subscriptions:remind');

        Mail::assertNothingQueued();
    }

    public function test_sends_once_more_when_expired_within_grace(): void
    {
        Mail::fake();
        config(['kasirai.subscription_grace_days' => 3]);
        $sub = $this->sub($this->admin(), now()->subDay(), ['last_reminder_days' => 1]);

        $this->artisan('subscriptions:remind');

        Mail::assertQueued(SubscriptionReminderMail::class, fn ($m) => $m->daysLeft === 0);
        $this->assertSame(0, $sub->fresh()->last_reminder_days);
    }

    public function test_no_reminder_after_grace_or_for_inactive_subscription(): void
    {
        Mail::fake();
        config(['kasirai.subscription_grace_days' => 3]);
        $this->sub($this->admin(), now()->subDays(10));                          // lewat tenggang
        $this->sub($this->admin(), now()->addDays(2), ['status' => 'expired']);  // bukan aktif

        $this->artisan('subscriptions:remind');

        Mail::assertNothingQueued();
    }

    public function test_dry_run_sends_nothing_and_records_nothing(): void
    {
        Mail::fake();
        $sub = $this->sub($this->admin(), now()->addDays(2));

        $this->artisan('subscriptions:remind --dry-run')->assertExitCode(0);

        Mail::assertNothingQueued();
        $this->assertNull($sub->fresh()->last_reminder_days);
    }

    public function test_email_has_reply_to_support_address_and_renew_link(): void
    {
        $user = $this->admin();
        $sub  = $this->sub($user, now()->addDays(3));
        $mail = new SubscriptionReminderMail($sub, 3);

        $mail->assertHasReplyTo(config('kasirai.support_email'));
        $this->assertSame('sikasirai0@gmail.com', config('kasirai.support_email'));
        $mail->assertSeeInHtml('/upgrade?plan=pro');
        $mail->assertSeeInHtml('3 hari lagi');
    }

    public function test_reminder_is_scheduled_daily(): void
    {
        $events = collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
            ->filter(fn ($e) => str_contains($e->command, 'subscriptions:remind'));

        $this->assertCount(1, $events);
        $this->assertSame('0 2 * * *', $events->first()->expression);
    }
}
