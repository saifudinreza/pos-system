<?php

namespace Tests\Feature;

use App\Models\AiChatUsage;
use App\Models\AiQueryLog;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
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

    private function makePaidOrder(Tenant $tenant, User $user, float $amount): Order
    {
        $order = Order::create([
            'tenant_id'    => $tenant->id,
            'user_id'      => $user->id,
            'order_number' => 'ORD-' . strtoupper(str()->random(10)),
            'status'       => 'paid',
            'subtotal'     => $amount,
            'tax'          => 0,
            'total'        => $amount,
        ]);

        Transaction::create([
            'order_id'          => $order->id,
            'midtrans_order_id' => 'MID-' . strtoupper(str()->random(10)),
            'status'            => 'settlement',
            'payment_method'    => 'cash',
            'amount'            => $amount,
            'paid_at'           => now(),
        ]);

        return $order;
    }

    // ── AI QUERY — data penjualan tidak boleh bocor antar tenant ──

    public function test_ai_query_does_not_leak_revenue_from_other_tenant(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $tenantB = $this->makeTenant('Toko B');
        $adminA  = $this->makeAdmin($tenantA);
        $adminB  = $this->makeAdmin($tenantB);

        $this->makePaidOrder($tenantA, $adminA, 50000);
        $this->makePaidOrder($tenantB, $adminB, 999000);

        // Mock AI provider — tangkap isi prompt yang dikirim ke LLM
        $capturedPrompt = null;
        $this->mock(\App\Services\GroqService::class, function ($mock) use (&$capturedPrompt) {
            $mock->shouldReceive('buildSalesPrompt')->andReturnUsing(function ($data) use (&$capturedPrompt) {
                $capturedPrompt = json_encode($data);
                return 'system';
            });
            $mock->shouldReceive('ask')->andReturn([
                'text'       => 'analisis selesai',
                'tokens_used' => 10,
                'provider'   => 'test',
                'model'      => 'test-model',
            ]);
        });

        Sanctum::actingAs($adminA);

        $response = $this->postJson('/api/ai/query', ['query' => 'berapa pendapatan bulan ini?']);

        $response->assertStatus(200);
        $this->assertNotNull($capturedPrompt, 'AI prompt tidak pernah dikirim');
        $this->assertStringContainsString('50.000', $capturedPrompt, 'Data tenant A harus ada di prompt');
        $this->assertStringNotContainsString('999.000', $capturedPrompt, 'Data tenant B bocor ke prompt tenant A!');
    }

    // ── AI LOGS — admin tenant hanya lihat log user tenant sendiri ──

    public function test_ai_logs_only_show_own_tenant(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $tenantB = $this->makeTenant('Toko B');
        $adminA  = $this->makeAdmin($tenantA);
        $userB   = User::factory()->create(['tenant_id' => $tenantB->id, 'role' => 'admin']);

        AiQueryLog::create([
            'user_id'     => $adminA->id,
            'type'        => 'sales_analysis',
            'query'       => 'pertanyaan toko A',
            'response'    => 'jawaban',
            'tokens_used' => 5,
        ]);
        AiQueryLog::create([
            'user_id'     => $userB->id,
            'type'        => 'sales_analysis',
            'query'       => 'pertanyaan toko B',
            'response'    => 'jawaban',
            'tokens_used' => 5,
        ]);

        Sanctum::actingAs($adminA);

        $response = $this->getJson('/api/ai/logs');

        $response->assertOk()->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.query', 'pertanyaan toko A');
    }

    // ── AI STATS — summary hanya hitung user dalam tenant sendiri ──

    public function test_ai_stats_only_count_own_tenant_usage(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $tenantB = $this->makeTenant('Toko B');
        $adminA  = $this->makeAdmin($tenantA);
        $adminB  = $this->makeAdmin($tenantB);

        AiQueryLog::create(['user_id' => $adminA->id, 'type' => 'sales_analysis', 'query' => 'q', 'response' => 'r', 'tokens_used' => 5]);
        AiQueryLog::create(['user_id' => $adminA->id, 'type' => 'stock_prediction', 'query' => 'q', 'response' => 'r', 'tokens_used' => 5]);
        AiQueryLog::create(['user_id' => $adminB->id, 'type' => 'sales_analysis', 'query' => 'q', 'response' => 'r', 'tokens_used' => 5]);

        Sanctum::actingAs($adminA);

        $response = $this->getJson('/api/ai/stats');

        $response->assertOk();
        $response->assertJsonPath('summary.today.requests', 2);
    }

    // ── REPORT SALES — transaksi tenant lain tidak masuk summary ──

    public function test_report_sales_only_include_own_tenant_transactions(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $tenantB = $this->makeTenant('Toko B');
        $adminA  = $this->makeAdmin($tenantA);
        $adminB  = $this->makeAdmin($tenantB);

        $this->makePaidOrder($tenantA, $adminA, 50000);
        $this->makePaidOrder($tenantB, $adminB, 999000);

        Sanctum::actingAs($adminA);

        $response = $this->getJson('/api/reports/sales?period=daily');

        $response->assertOk();
        $this->assertEquals(50000, (int) $response->json('data.summary.total_revenue'));
        $this->assertEquals(1, (int) $response->json('data.summary.total_transactions'));
    }
}
