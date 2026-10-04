<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Penurunan paket otomatis saat langganan berakhir (subscriptions:expire).
 */
class ExpireSubscriptionsTest extends TestCase
{
    use RefreshDatabase;

    private function proTenant(string $slug = 'toko-a'): array
    {
        $tenant = Tenant::create(['name' => 'Toko ' . $slug, 'slug' => $slug]);
        $admin  = User::factory()->create(['tenant_id' => $tenant->id, 'role' => 'admin', 'subscription_plan' => 'pro']);
        $kasir  = User::factory()->create(['tenant_id' => $tenant->id, 'role' => 'kasir', 'subscription_plan' => 'pro']);

        return [$tenant, $admin, $kasir];
    }

    private function sub(User $user, string $plan, $expiresAt, string $status = 'active'): Subscription
    {
        return Subscription::create([
            'user_id'           => $user->id,
            'plan'              => $plan,
            'billing_cycle'     => 'monthly',
            'amount'            => 129000,
            'status'            => $status,
            'midtrans_order_id' => 'SUB-' . uniqid(),
            'paid_at'           => now()->subMonth(),
            'expires_at'        => $expiresAt,
        ]);
    }

    public function test_expired_beyond_grace_downgrades_owner_and_tenant_to_free(): void
    {
        config(['kasirai.subscription_grace_days' => 3]);
        [, $admin, $kasir] = $this->proTenant();
        $sub = $this->sub($admin, 'pro', now()->subDays(4));

        $this->artisan('subscriptions:expire')->assertExitCode(0);

        $this->assertSame('expired', $sub->fresh()->status);
        $this->assertSame('free', $admin->fresh()->subscription_plan);
        $this->assertSame('free', $kasir->fresh()->subscription_plan);
    }

    public function test_within_grace_period_keeps_plan(): void
    {
        config(['kasirai.subscription_grace_days' => 3]);
        [, $admin] = $this->proTenant();
        $sub = $this->sub($admin, 'pro', now()->subDays(2));

        $this->artisan('subscriptions:expire')->assertExitCode(0);

        $this->assertSame('active', $sub->fresh()->status);
        $this->assertSame('pro', $admin->fresh()->subscription_plan);
    }

    public function test_not_yet_expired_is_untouched(): void
    {
        [, $admin] = $this->proTenant();
        $sub = $this->sub($admin, 'pro', now()->addDays(10));

        $this->artisan('subscriptions:expire')->assertExitCode(0);

        $this->assertSame('active', $sub->fresh()->status);
        $this->assertSame('pro', $admin->fresh()->subscription_plan);
    }

    public function test_manually_granted_plan_without_subscription_is_untouched(): void
    {
        [, $admin] = $this->proTenant();   // pro tanpa baris langganan (diberikan developer)

        $this->artisan('subscriptions:expire')->assertExitCode(0);

        $this->assertSame('pro', $admin->fresh()->subscription_plan);
    }

    public function test_other_tenants_are_not_affected(): void
    {
        [, $adminA] = $this->proTenant('toko-a');
        [, $adminB, $kasirB] = $this->proTenant('toko-b');
        $this->sub($adminA, 'pro', now()->subDays(10));
        $this->sub($adminB, 'pro', now()->addDays(10));

        $this->artisan('subscriptions:expire')->assertExitCode(0);

        $this->assertSame('free', $adminA->fresh()->subscription_plan);
        $this->assertSame('pro', $adminB->fresh()->subscription_plan);
        $this->assertSame('pro', $kasirB->fresh()->subscription_plan);
    }

    public function test_falls_back_to_remaining_active_subscription_plan(): void
    {
        config(['kasirai.subscription_grace_days' => 0]);
        [, $admin] = $this->proTenant();
        $admin->update(['subscription_plan' => 'enterprise']);
        $this->sub($admin, 'pro', now()->subDay());
        $this->sub($admin, 'enterprise', now()->addMonth());

        $this->artisan('subscriptions:expire')->assertExitCode(0);

        $this->assertSame('enterprise', $admin->fresh()->subscription_plan);
    }

    public function test_dry_run_changes_nothing_and_command_is_idempotent(): void
    {
        config(['kasirai.subscription_grace_days' => 0]);
        [, $admin] = $this->proTenant();
        $sub = $this->sub($admin, 'pro', now()->subDay());

        $this->artisan('subscriptions:expire --dry-run')->assertExitCode(0);
        $this->assertSame('active', $sub->fresh()->status);
        $this->assertSame('pro', $admin->fresh()->subscription_plan);

        $this->artisan('subscriptions:expire')->assertExitCode(0);
        $this->artisan('subscriptions:expire')->assertExitCode(0);
        $this->assertSame('free', $admin->fresh()->subscription_plan);
    }

    public function test_user_without_tenant_does_not_downgrade_other_tenantless_users(): void
    {
        config(['kasirai.subscription_grace_days' => 0]);
        $a = User::factory()->create(['tenant_id' => null, 'role' => 'admin', 'subscription_plan' => 'pro']);
        $b = User::factory()->create(['tenant_id' => null, 'role' => 'admin', 'subscription_plan' => 'pro']);
        $this->sub($a, 'pro', now()->subDay());

        $this->artisan('subscriptions:expire')->assertExitCode(0);

        $this->assertSame('free', $a->fresh()->subscription_plan);
        $this->assertSame('pro', $b->fresh()->subscription_plan);
    }

    public function test_command_is_scheduled_hourly(): void
    {
        $events = collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
            ->filter(fn ($e) => str_contains($e->command, 'subscriptions:expire'));

        $this->assertCount(1, $events);
        $this->assertSame('0 * * * *', $events->first()->expression);
    }
}
