<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerListTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(string $name): Tenant
    {
        return Tenant::create(['name' => $name, 'slug' => str()->slug($name)]);
    }

    private function makeUser(Tenant $tenant, string $role = 'admin'): User
    {
        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role'      => $role,
        ]);
    }

    private function makeOrder(Tenant $tenant, User $user, Customer $customer, string $status = 'paid'): Order
    {
        return Order::create([
            'tenant_id'    => $tenant->id,
            'user_id'      => $user->id,
            'customer_id'  => $customer->id,
            'order_number' => 'ORD-C-' . $tenant->id . '-' . str()->random(6),
            'status'       => $status,
            'subtotal'     => 100000,
            'tax'          => 11000,
            'total'        => 111000,
            'customer_phone' => $customer->phone,
        ]);
    }

    public function test_customer_list_returns_aggregates(): void
    {
        $tenant = $this->makeTenant('Toko CRM');
        $admin  = $this->makeUser($tenant);
        $customer = Customer::findOrCreateByPhone('081234567890', $tenant->id);

        // 2 order lunas + 1 dibatalkan → total_spent harus hitung yang lunas saja
        $this->makeOrder($tenant, $admin, $customer);
        $this->makeOrder($tenant, $admin, $customer);
        $this->makeOrder($tenant, $admin, $customer, 'cancelled');

        Sanctum::actingAs($admin);

        $this->getJson('/api/customers')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.phone', '6281234567890')
            ->assertJsonPath('data.0.orders_count', 2)
            ->assertJsonPath('data.0.total_spent', 222000);
    }

    public function test_customer_list_search_by_phone(): void
    {
        $tenant = $this->makeTenant('Toko Search');
        $admin  = $this->makeUser($tenant);
        Customer::findOrCreateByPhone('085711223344', $tenant->id);
        Customer::findOrCreateByPhone('082199887766', $tenant->id);

        Sanctum::actingAs($admin);

        $this->getJson('/api/customers?search=8571')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.phone', '6285711223344');
    }

    public function test_customer_list_isolated_per_tenant(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $adminA  = $this->makeUser($tenantA);
        Customer::findOrCreateByPhone('081111111111', $tenantA->id);

        $tenantB = $this->makeTenant('Toko B');
        $adminB  = $this->makeUser($tenantB);
        Customer::findOrCreateByPhone('082222222222', $tenantB->id);

        Sanctum::actingAs($adminA);

        $this->getJson('/api/customers')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.phone', '6281111111111');
    }

    public function test_customer_show_returns_order_history(): void
    {
        $tenant = $this->makeTenant('Toko Detail');
        $admin  = $this->makeUser($tenant);
        $customer = Customer::findOrCreateByPhone('081298765432', $tenant->id);
        $this->makeOrder($tenant, $admin, $customer);

        Sanctum::actingAs($admin);

        $this->getJson("/api/customers/{$customer->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.summary.orders_count', 1)
            ->assertJsonPath('data.summary.total_spent', 111000)
            ->assertJsonCount(1, 'data.orders')
            ->assertJsonPath('data.orders.0.status', 'paid');
    }

    public function test_customers_requires_admin_role(): void
    {
        $tenant = $this->makeTenant('Toko Role');
        $kasir  = $this->makeUser($tenant, 'kasir');

        Sanctum::actingAs($kasir);

        $this->getJson('/api/customers')->assertStatus(403);
    }
}
