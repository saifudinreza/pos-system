<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryLedgerTest extends TestCase
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

    private function makeProduct(Tenant $tenant, int $stock = 50): Product
    {
        $category = $tenant->categories()->create(['name' => 'Kategori ' . $tenant->name, 'is_active' => true]);

        return $tenant->products()->create([
            'category_id' => $category->id,
            'name'        => 'Produk ' . $tenant->name,
            'sku'         => 'SKU-' . strtoupper(str()->random(6)),
            'price'       => 10000,
            'cost'        => 7000,
            'stock'       => $stock,
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

    public function test_order_creates_customer_and_sale_movement(): void
    {
        $tenant  = $this->makeTenant('Toko Ledger');
        $admin   = $this->makeUser($tenant, 'admin');
        $product = $this->makeProduct($tenant, 50);
        $this->openShift($tenant, $admin);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/orders', [
            'items'          => [['product_id' => $product->id, 'quantity' => 3]],
            'customer_phone' => '08123456789',
        ]);

        $response->assertStatus(201);

        // Customer dibuat dari nomor HP (dinormalisasi ke 62)
        $customer = Customer::where('phone', '628123456789')->first();
        $this->assertNotNull($customer, 'Customer harus dibuat dari nomor HP');
        $this->assertEquals($tenant->id, $customer->tenant_id);

        // Order tertaut ke customer
        $order = Order::find($response->json('data.id'));
        $this->assertEquals($customer->id, $order->customer_id);

        // Movement sale tercatat dengan snapshot stok yang benar
        $movement = InventoryMovement::where('product_id', $product->id)
            ->where('type', 'sale')
            ->latest()
            ->first();

        $this->assertNotNull($movement, 'Movement sale harus tercatat');
        $this->assertEquals(3, $movement->quantity);
        $this->assertEquals(50, $movement->before_stock);
        $this->assertEquals(47, $movement->after_stock);
        $this->assertEquals('order', $movement->ref_type);
        $this->assertEquals($order->id, $movement->ref_id);

        // Stok produk benar-benar berkurang
        $this->assertEquals(47, $product->fresh()->stock);
    }

    public function test_cancelling_order_restores_stock_and_records_cancel_movement(): void
    {
        $tenant  = $this->makeTenant('Toko Cancel');
        $admin   = $this->makeUser($tenant, 'admin');
        $product = $this->makeProduct($tenant, 20);
        $this->openShift($tenant, $admin);

        Sanctum::actingAs($admin);

        $orderResponse = $this->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 4]],
        ]);
        $orderId = $orderResponse->json('data.id');

        $this->patchJson("/api/orders/{$orderId}/status", ['status' => 'cancelled'])
            ->assertStatus(200);

        // Stok kembali
        $this->assertEquals(20, $product->fresh()->stock);

        // Movement cancel tercatat
        $cancel = InventoryMovement::where('product_id', $product->id)
            ->where('type', 'cancel')
            ->latest()
            ->first();
        $this->assertNotNull($cancel);
        $this->assertEquals(16, $cancel->before_stock);
        $this->assertEquals(20, $cancel->after_stock);
    }

    public function test_restock_endpoint_increases_stock_and_records_movement(): void
    {
        $tenant  = $this->makeTenant('Toko Restok');
        $admin   = $this->makeUser($tenant, 'admin');
        $product = $this->makeProduct($tenant, 10);

        Sanctum::actingAs($admin);

        $this->postJson("/api/products/{$product->id}/restock", [
            'quantity' => 25,
            'note'     => 'Restok dari supplier',
        ])->assertStatus(200);

        $this->assertEquals(35, $product->fresh()->stock);

        $movement = InventoryMovement::where('product_id', $product->id)
            ->where('type', 'restock')
            ->latest()
            ->first();
        $this->assertNotNull($movement);
        $this->assertEquals(25, $movement->quantity);
        $this->assertEquals(10, $movement->before_stock);
        $this->assertEquals(35, $movement->after_stock);
        $this->assertEquals('Restok dari supplier', $movement->note);
    }

    public function test_movements_are_isolated_per_tenant(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $adminA  = $this->makeUser($tenantA, 'admin');
        $productA = $this->makeProduct($tenantA, 10);
        $this->openShift($tenantA, $adminA);

        $tenantB = $this->makeTenant('Toko B');
        $adminB  = $this->makeUser($tenantB, 'admin');
        $productB = $this->makeProduct($tenantB, 10);
        $this->openShift($tenantB, $adminB);

        // A bertransaksi
        Sanctum::actingAs($adminA);
        $this->postJson('/api/orders', [
            'items' => [['product_id' => $productA->id, 'quantity' => 2]],
        ])->assertStatus(201);

        // B bertransaksi
        Sanctum::actingAs($adminB);
        $this->postJson('/api/orders', [
            'items' => [['product_id' => $productB->id, 'quantity' => 2]],
        ])->assertStatus(201);

        // A hanya melihat movement milik tenant A
        $response = Sanctum::actingAs($adminA)
            ? $this->getJson("/api/products/{$productA->id}/movements")
            : null;
        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('meta.total'));

        // Tenant B tidak bisa melihat movement produk A
        Sanctum::actingAs($adminB);
        $this->getJson("/api/products/{$productA->id}/movements")->assertStatus(404);
    }

    public function test_audit_log_recorded_when_product_created(): void
    {
        $tenant = $this->makeTenant('Toko Audit');
        $admin  = $this->makeUser($tenant, 'admin');
        $category = $tenant->categories()->create(['name' => 'Minuman', 'is_active' => true]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/products', [
            'category_id' => $category->id,
            'name'        => 'Teh Botol',
            'sku'         => 'AUD-001',
            'price'       => 5000,
            'cost'        => 4000,
            'stock'       => 10,
        ])->assertStatus(201);

        $this->assertDatabaseHas('audit_logs', [
            'tenant_id'   => $tenant->id,
            'user_id'     => $admin->id,
            'action'      => 'created',
            'entity_type' => 'product',
        ]);
    }
}
