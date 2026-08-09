<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfitReportTest extends TestCase
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

    private function makeProduct(Tenant $tenant, float $price, ?float $cost): Product
    {
        $category = $tenant->categories()->create(['name' => 'Kategori ' . $tenant->name, 'is_active' => true]);

        return $tenant->products()->create([
            'category_id' => $category->id,
            'name'        => 'Produk ' . $tenant->name,
            'sku'         => 'SKU-' . strtoupper(str()->random(6)),
            'price'       => $price,
            'cost'        => $cost,
            'stock'       => 100,
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

    private function settleOrder(Order $order, float $amount): void
    {
        $order->update(['status' => 'paid']);
        Transaction::create([
            'order_id'          => $order->id,
            'midtrans_order_id' => $order->order_number,
            'status'            => 'settlement',
            'amount'            => $amount,
            'paid_at'           => now(),
        ]);
    }

    public function test_order_snapshots_cost_into_order_items(): void
    {
        $tenant  = $this->makeTenant('Toko Snapshot');
        $admin   = $this->makeUser($tenant);
        $product = $this->makeProduct($tenant, 10000, 7000);
        $this->openShift($tenant, $admin);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 3]],
        ])->assertStatus(201);

        $item = OrderItem::where('order_id', $response->json('data.id'))->first();
        $this->assertEquals(7000, (float) $item->cost);
    }

    public function test_sales_report_returns_cogs_and_gross_profit(): void
    {
        $tenant  = $this->makeTenant('Toko Profit');
        $admin   = $this->makeUser($tenant);
        $product = $this->makeProduct($tenant, 10000, 7000);
        $this->openShift($tenant, $admin);

        Sanctum::actingAs($admin);

        $orderRes = $this->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 3]],
        ])->assertStatus(201);
        $order = Order::find($orderRes->json('data.id'));

        // Simulasikan pembayaran sukses dengan nominal = subtotal (tanpa pajak)
        $this->settleOrder($order, 30000);

        $this->getJson('/api/reports/sales?date_from=' . now()->toDateString() . '&date_to=' . now()->toDateString())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.total_revenue', 30000)
            ->assertJsonPath('data.summary.total_cogs', 21000)
            ->assertJsonPath('data.summary.gross_profit', 9000)
            ->assertJsonPath('data.summary.profit_margin', 30);
    }

    public function test_profit_zero_when_product_has_no_cost(): void
    {
        $tenant  = $this->makeTenant('Toko No Cost');
        $admin   = $this->makeUser($tenant);
        $product = $this->makeProduct($tenant, 10000, null);
        $this->openShift($tenant, $admin);

        Sanctum::actingAs($admin);

        $orderRes = $this->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertStatus(201);
        $this->settleOrder(Order::find($orderRes->json('data.id')), 20000);

        $this->getJson('/api/reports/sales?date_from=' . now()->toDateString() . '&date_to=' . now()->toDateString())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.total_cogs', 0)
            ->assertJsonPath('data.summary.gross_profit', 20000)
            ->assertJsonPath('data.summary.profit_margin', 100);
    }

    public function test_profit_isolated_per_tenant(): void
    {
        $tenantA  = $this->makeTenant('Toko A');
        $adminA   = $this->makeUser($tenantA);
        $productA = $this->makeProduct($tenantA, 10000, 6000);
        $this->openShift($tenantA, $adminA);

        $tenantB  = $this->makeTenant('Toko B');
        $adminB   = $this->makeUser($tenantB);

        Sanctum::actingAs($adminA);
        $orderRes = $this->postJson('/api/orders', [
            'items' => [['product_id' => $productA->id, 'quantity' => 5]],
        ])->assertStatus(201);
        $this->settleOrder(Order::find($orderRes->json('data.id')), 50000);

        // Tenant B melihat 0 COGS & profit — data A tidak bocor
        Sanctum::actingAs($adminB);
        $this->getJson('/api/reports/sales?date_from=' . now()->toDateString() . '&date_to=' . now()->toDateString())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.total_cogs', 0)
            ->assertJsonPath('data.summary.gross_profit', 0);
    }
}
