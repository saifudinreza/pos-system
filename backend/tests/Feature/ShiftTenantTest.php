<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ShiftTenantTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(string $name): Tenant
    {
        return Tenant::create(['name' => $name, 'slug' => str()->slug($name)]);
    }

    private function makeUser(Tenant $tenant, string $role = 'kasir'): User
    {
        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role'      => $role,
        ]);
    }

    private function makeProduct(Tenant $tenant): Product
    {
        $category = $tenant->categories()->create(['name' => 'Kategori ' . $tenant->name, 'is_active' => true]);

        return $tenant->products()->create([
            'category_id' => $category->id,
            'name'        => 'Produk ' . $tenant->name,
            'sku'         => 'SKU-' . strtoupper(str()->random(6)),
            'price'       => 10000,
            'stock'       => 50,
            'stock_alert' => 5,
            'is_active'   => true,
        ]);
    }

    private function openShift(Tenant $tenant, User $user): Shift
    {
        return Shift::create([
            'tenant_id'       => $tenant->id,
            'user_id'         => $user->id,
            'shift_number'    => 1,
            'shift_name'      => 'Pagi',
            'status'          => 'open',
            'opened_at'       => now(),
            'opening_balance' => 0,
        ]);
    }

    public function test_order_rejected_when_no_open_shift_in_tenant(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $adminA  = $this->makeUser($tenantA, 'admin');
        $product = $this->makeProduct($tenantA);

        Sanctum::actingAs($adminA);

        $response = $this->postJson('/api/orders', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422)->assertJsonPath('no_shift', true);
    }

    public function test_shift_is_shared_across_all_kasir_in_same_tenant(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $kasirA  = $this->makeUser($tenantA, 'kasir');
        $kasirB  = $this->makeUser($tenantA, 'kasir');
        $product = $this->makeProduct($tenantA);

        // Kasir A buka shift
        $this->openShift($tenantA, $kasirA);

        // Kasir B bisa checkout dengan shift milik kasir A (shift per-tenant)
        Sanctum::actingAs($kasirB);

        $response = $this->postJson('/api/orders', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('orders', [
            'tenant_id' => $tenantA->id,
            'user_id'   => $kasirB->id,
        ]);
    }

    public function test_shift_of_another_tenant_is_not_visible(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $tenantB = $this->makeTenant('Toko B');
        $kasirA  = $this->makeUser($tenantA, 'kasir');
        $kasirB  = $this->makeUser($tenantB, 'kasir');
        $product = $this->makeProduct($tenantA);

        // Hanya tenant B yang punya shift aktif — kasir A tidak boleh melihatnya
        $this->openShift($tenantB, $kasirB);

        Sanctum::actingAs($kasirA);

        $response = $this->postJson('/api/orders', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422)->assertJsonPath('no_shift', true);
    }

    public function test_orders_index_only_shows_own_tenant(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $tenantB = $this->makeTenant('Toko B');
        $adminA  = $this->makeUser($tenantA, 'admin');
        $kasirB  = $this->makeUser($tenantB, 'kasir');

        Order::create([
            'tenant_id'    => $tenantA->id,
            'user_id'      => $adminA->id,
            'order_number' => 'ORD-' . strtoupper(str()->random(8)),
            'status'       => 'pending',
            'subtotal'     => 10000,
            'tax'          => 1100,
            'total'        => 11100,
        ]);
        Order::create([
            'tenant_id'    => $tenantB->id,
            'user_id'      => $kasirB->id,
            'order_number' => 'ORD-' . strtoupper(str()->random(8)),
            'status'       => 'pending',
            'subtotal'     => 20000,
            'tax'          => 2200,
            'total'        => 22200,
        ]);

        Sanctum::actingAs($adminA);

        $response = $this->getJson('/api/orders');
        $response->assertOk()->assertJsonCount(1, 'data');
    }
}
