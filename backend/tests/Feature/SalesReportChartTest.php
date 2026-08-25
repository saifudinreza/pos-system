<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Test chart data laporan penjualan, memastikan query-nya portabel
 * (berjalan di SQLite :memory: maupun MySQL production).
 *
 * Dulu chart bulanan memakai MONTH() (MySQL-only), di-fix jadi
 * dikelompokkan di PHP via Carbon (aturan CLAUDE.md point 9).
 */
class SalesReportChartTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(string $name): Tenant
    {
        return Tenant::create(['name' => $name, 'slug' => str()->slug($name)]);
    }

    private function makeAdmin(Tenant $tenant): User
    {
        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role'      => 'admin',
        ]);
    }

    private function makeProduct(Tenant $tenant): Product
    {
        $category = $tenant->categories()->create(['name' => 'Kategori', 'is_active' => true]);

        return $tenant->products()->create([
            'category_id' => $category->id,
            'name'        => 'Produk Chart',
            'sku'         => 'SKU-CHART-' . strtoupper(str()->random(4)),
            'price'       => 10000,
            'cost'        => 7000,
            'stock'       => 100,
            'stock_alert' => 5,
            'is_active'   => true,
        ]);
    }

    private function openShift(Tenant $tenant, User $admin): Shift
    {
        return Shift::create([
            'tenant_id'       => $tenant->id,
            'user_id'         => $admin->id,
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

    public function test_monthly_chart_groups_revenue_per_month(): void
    {
        $tenant  = $this->makeTenant('Toko Chart');
        $admin   = $this->makeAdmin($tenant);
        $product = $this->makeProduct($tenant);
        $this->openShift($tenant, $admin);

        Sanctum::actingAs($admin);

        $orderRes = $this->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertStatus(201);
        $this->settleOrder(Order::find($orderRes->json('data.id')), 20000);

        $currentMonth = (int) now()->month;

        $this->getJson('/api/reports/sales?period=monthly&year=' . now()->year)
            ->assertStatus(200)
            ->assertJsonPath('data.period', 'monthly')
            ->assertJsonPath('data.chart_data.0.period', $currentMonth)
            ->assertJsonPath('data.chart_data.0.total_transactions', 1)
            ->assertJsonPath('data.chart_data.0.total_revenue', 20000)
            ->assertJsonStructure([
                'data' => ['chart_data' => [['period', 'label', 'total_transactions', 'total_revenue']]],
            ]);
    }

    public function test_monthly_chart_isolated_per_tenant(): void
    {
        $tenantA  = $this->makeTenant('Toko A');
        $adminA   = $this->makeAdmin($tenantA);
        $productA = $this->makeProduct($tenantA);
        $this->openShift($tenantA, $adminA);

        $tenantB = $this->makeTenant('Toko B');
        $adminB  = $this->makeAdmin($tenantB);

        Sanctum::actingAs($adminA);
        $orderRes = $this->postJson('/api/orders', [
            'items' => [['product_id' => $productA->id, 'quantity' => 1]],
        ])->assertStatus(201);
        $this->settleOrder(Order::find($orderRes->json('data.id')), 10000);

        // Tenant B tidak boleh melihat transaksi tenant A di chart bulanan
        Sanctum::actingAs($adminB);
        $this->getJson('/api/reports/sales?period=monthly&year=' . now()->year)
            ->assertStatus(200)
            ->assertJsonCount(0, 'data.chart_data');
    }
}
