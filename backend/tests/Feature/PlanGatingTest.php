<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\SubscriptionController;
use App\Models\AiChatUsage;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlanGatingTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(string $name): Tenant
    {
        return Tenant::create(['name' => $name, 'slug' => str()->slug($name)]);
    }

    private function makeUser(Tenant $tenant, string $role, string $plan): User
    {
        return User::factory()->create([
            'tenant_id'         => $tenant->id,
            'role'              => $role,
            'subscription_plan' => $plan,
        ]);
    }

    private function makeProduct(Tenant $tenant, string $name): Product
    {
        $category = $tenant->categories()->first()
            ?? $tenant->categories()->create(['name' => 'Kategori', 'is_active' => true]);

        return $tenant->products()->create([
            'category_id' => $category->id,
            'name'        => $name,
            'sku'         => 'SKU-' . strtoupper(str()->random(8)),
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

    private function makePendingOrder(Tenant $tenant, User $user): Order
    {
        return Order::create([
            'tenant_id'    => $tenant->id,
            'user_id'      => $user->id,
            'order_number' => 'ORD-' . strtoupper(str()->random(10)),
            'status'       => 'pending',
            'subtotal'     => 10000,
            'tax'          => 1100,
            'total'        => 11100,
        ]);
    }

    // ── QRIS / pembayaran digital — FREE diblokir, PRO boleh ──

    public function test_qris_create_blocked_for_free_plan(): void
    {
        $tenant = $this->makeTenant('Toko A');
        $admin  = $this->makeUser($tenant, 'admin', 'free');
        $order  = $this->makePendingOrder($tenant, $admin);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/transactions', ['order_id' => $order->id]);

        $response->assertStatus(422)->assertJsonPath('plan_required', 'pro');
    }

    public function test_kasir_of_free_tenant_also_blocked_from_qris(): void
    {
        $tenant = $this->makeTenant('Toko A');
        $admin  = $this->makeUser($tenant, 'admin', 'free');
        $kasir  = $this->makeUser($tenant, 'kasir', 'free');
        $order  = $this->makePendingOrder($tenant, $admin);

        Sanctum::actingAs($kasir);

        $response = $this->postJson('/api/transactions', ['order_id' => $order->id]);

        $response->assertStatus(422)->assertJsonPath('plan_required', 'pro');
    }

    // ── Export PDF/Excel — FREE diblokir ──

    public function test_report_download_blocked_for_free_plan(): void
    {
        $tenant = $this->makeTenant('Toko A');
        $admin  = $this->makeUser($tenant, 'admin', 'free');

        Sanctum::actingAs($admin);

        $this->getJson('/api/reports/sales/download')->assertStatus(403)->assertJsonPath('plan_required', 'pro');
        $this->getJson('/api/reports/stock/download')->assertStatus(403)->assertJsonPath('plan_required', 'pro');
    }

    // ── Kuota AI — FREE 5/bulan, PRO unlimited, kasir ikut plan admin tenant ──

    public function test_ai_usage_today_free_plan_shows_monthly_limit(): void
    {
        $tenant = $this->makeTenant('Toko A');
        $admin  = $this->makeUser($tenant, 'admin', 'free');

        AiChatUsage::create(['user_id' => $admin->id, 'usage_date' => today(), 'count' => 2]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/ai/usage-today');

        $response->assertOk()
            ->assertJsonPath('used', 2)
            ->assertJsonPath('limit', 5)
            ->assertJsonPath('remaining', 3);
    }

    public function test_ai_usage_today_pro_plan_is_unlimited(): void
    {
        $tenant = $this->makeTenant('Toko A');
        $admin  = $this->makeUser($tenant, 'admin', 'pro');

        Sanctum::actingAs($admin);

        $this->getJson('/api/ai/usage-today')
            ->assertOk()
            ->assertJsonPath('limit', null)
            ->assertJsonPath('remaining', null);
    }

    public function test_kasir_follows_tenant_admin_plan(): void
    {
        $tenant = $this->makeTenant('Toko A');
        $this->makeUser($tenant, 'admin', 'pro');
        $kasir = $this->makeUser($tenant, 'kasir', 'free');

        Sanctum::actingAs($kasir);

        // Kasir plan-nya "free", tapi tenant admin-nya Pro → AI harus unlimited
        $this->getJson('/api/ai/usage-today')
            ->assertOk()
            ->assertJsonPath('limit', null);
    }

    public function test_ai_query_blocked_after_monthly_limit_reached(): void
    {
        $tenant = $this->makeTenant('Toko A');
        $admin  = $this->makeUser($tenant, 'admin', 'free');

        // Sudah pakai 5 prompt bulan ini (limit free = 5)
        AiChatUsage::create(['user_id' => $admin->id, 'usage_date' => today(), 'count' => 5]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/ai/query', ['query' => 'analisis']);

        $response->assertStatus(429)->assertJsonPath('limit_reached', true);
    }

    // ── Read limit produk & kategori — FREE 50/15, PRO unlimited ──

    public function test_free_plan_products_capped_at_50(): void
    {
        $tenant = $this->makeTenant('Toko A');
        $admin  = $this->makeUser($tenant, 'admin', 'free');

        for ($i = 0; $i < 55; $i++) {
            $this->makeProduct($tenant, 'Produk ' . $i);
        }

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/products');

        $response->assertOk()
            ->assertJsonCount(50, 'data')
            ->assertJsonPath('meta.plan', 'free')
            ->assertJsonPath('meta.plan_limit', 50)
            ->assertJsonPath('meta.is_limited', true);
    }

    public function test_pro_plan_products_not_capped(): void
    {
        $tenant = $this->makeTenant('Toko A');
        $admin  = $this->makeUser($tenant, 'admin', 'pro');

        for ($i = 0; $i < 55; $i++) {
            $this->makeProduct($tenant, 'Produk ' . $i);
        }

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/products?per_page=100');

        $response->assertOk()
            ->assertJsonCount(55, 'data')
            ->assertJsonPath('meta.plan_limit', null);
    }

    // ── Harga subscription — harus sinkron dengan halaman upgrade ──

    public function test_subscription_prices_match_new_plans(): void
    {
        $this->assertSame([
            'pro'        => ['monthly' => 129000, 'yearly' => 100000],
            'enterprise' => ['monthly' => 499000, 'yearly' => 399000],
        ], SubscriptionController::PRICES);
    }
}
