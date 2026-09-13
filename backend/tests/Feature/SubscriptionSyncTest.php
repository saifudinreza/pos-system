<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionSyncTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(string $name): Tenant
    {
        return Tenant::create(['name' => $name, 'slug' => str()->slug($name)]);
    }

    private function makeUser(Tenant $tenant, string $role, string $plan = 'free'): User
    {
        return User::factory()->create([
            'tenant_id'         => $tenant->id,
            'role'              => $role,
            'subscription_plan' => $plan,
        ]);
    }

    // ── Register: subscription_plan sync dengan admin tenant ──

    public function test_new_kasir_inherits_admin_plan_on_registration(): void
    {
        $tenant = $this->makeTenant('Toko Pro');
        $this->makeUser($tenant, 'admin', 'pro');

        $response = $this->postJson('/api/register', [
            'name'       => 'Kasir Baru',
            'email'      => 'kasir@example.com',
            'password'   => 'password123',
            'store_name' => 'Toko Pro',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email'             => 'kasir@example.com',
            'subscription_plan' => 'pro',
        ]);
    }

    public function test_new_kasir_inherits_free_plan_when_admin_is_free(): void
    {
        $tenant = $this->makeTenant('Toko Free');
        $this->makeUser($tenant, 'admin', 'free');

        $response = $this->postJson('/api/register', [
            'name'       => 'Kasir Baru',
            'email'      => 'kasir@example.com',
            'password'   => 'password123',
            'store_name' => 'Toko Free',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email'             => 'kasir@example.com',
            'subscription_plan' => 'free',
        ]);
    }

    public function test_new_kasir_inherits_enterprise_plan(): void
    {
        $tenant = $this->makeTenant('Toko Enterprise');
        $this->makeUser($tenant, 'admin', 'enterprise');

        $response = $this->postJson('/api/register', [
            'name'       => 'Kasir Baru',
            'email'      => 'kasir@example.com',
            'password'   => 'password123',
            'store_name' => 'Toko Enterprise',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email'             => 'kasir@example.com',
            'subscription_plan' => 'enterprise',
        ]);
    }

    // ── Register: limit kasir per tenant ──

    public function test_kasir_limit_reached_returns_422(): void
    {
        $tenant = $this->makeTenant('Toko Full');
        $this->makeUser($tenant, 'admin', 'free');
        $this->makeUser($tenant, 'kasir', 'free');
        $this->makeUser($tenant, 'kasir', 'free');

        $response = $this->postJson('/api/register', [
            'name'       => 'Kasir Ke-3',
            'email'      => 'kasir3@example.com',
            'password'   => 'password123',
            'store_name' => 'Toko Full',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Toko "Toko Full" sudah mencapai batas maksimal kasir (2).',
            ]);
    }

    public function test_kasir_under_limit_can_register(): void
    {
        $tenant = $this->makeTenant('Toko Baru');
        $this->makeUser($tenant, 'admin', 'free');
        $this->makeUser($tenant, 'kasir', 'free');

        $response = $this->postJson('/api/register', [
            'name'       => 'Kasir Ke-2',
            'email'      => 'kasir2@example.com',
            'password'   => 'password123',
            'store_name' => 'Toko Baru',
        ]);

        $response->assertStatus(201);
    }

    // ── New tenant: admin gets free plan ──

    public function test_new_admin_gets_free_plan_by_default(): void
    {
        $response = $this->postJson('/api/register', [
            'name'       => 'Admin Baru',
            'email'      => 'admin@example.com',
            'password'   => 'password123',
            'store_name' => 'Toko Baru',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email'             => 'admin@example.com',
            'subscription_plan' => 'free',
        ]);
    }
}
