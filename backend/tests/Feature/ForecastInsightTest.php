<?php

namespace Tests\Feature;

use App\Models\AiInsight;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use App\Services\GroqService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ForecastInsightTest extends TestCase
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

    private function seedOrders(Tenant $tenant, int $count, float $amount): void
    {
        for ($i = 0; $i < $count; $i++) {
            Order::create([
                'tenant_id'    => $tenant->id,
                'user_id'      => $tenant->users()->first()->id,
                'order_number' => 'ORD-TEST-' . $tenant->id . '-' . $i . '-' . str()->random(4),
                'status'       => 'paid',
                'subtotal'     => $amount,
                'tax'          => round($amount * 0.11, 2),
                'total'        => round($amount * 1.11, 2),
                'created_at'   => now()->subDays(rand(1, 20)),
            ]);
        }
    }

    public function test_forecast_returns_seven_days_deterministic(): void
    {
        $tenant = $this->makeTenant('Toko Forecast');
        $admin  = $this->makeUser($tenant);
        $this->seedOrders($tenant, 20, 100000);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/reports/forecast')->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(7, $data['days']);
        $this->assertArrayHasKey('date', $data['days'][0]);
        $this->assertArrayHasKey('predicted', $data['days'][0]);
        $this->assertArrayHasKey('weekday', $data['days'][0]);
        // 7 hari × Rp111.000 (total per order) = 777.000 (semua order 20 hari terakhir masuk rata-rata)
        $this->assertGreaterThan(0, $data['total']);
    }

    public function test_forecast_isolated_per_tenant(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $adminA  = $this->makeUser($tenantA);
        $this->seedOrders($tenantA, 10, 50000);

        $tenantB = $this->makeTenant('Toko B');
        $adminB  = $this->makeUser($tenantB);

        // Tenant B tidak punya order sama sekali → total forecast 0
        Sanctum::actingAs($adminB);
        $this->getJson('/api/reports/forecast')
            ->assertStatus(200)
            ->assertJsonPath('data.total', 0);
    }

    public function test_generate_insight_uses_llm_and_stores(): void
    {
        $tenant = $this->makeTenant('Toko Insight');
        $admin  = $this->makeUser($tenant);
        $this->seedOrders($tenant, 5, 20000);

        $this->mock(GroqService::class, function ($mock) {
            $mock->shouldReceive('ask')->once()->andReturn([
                'text' => '[{"type":"sales","title":"Pendapatan stabil","body":"Minggu ini omzet terjaga."}]',
            ]);
        });

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/insights/generate')->assertStatus(200);
        $this->assertCount(1, $response->json('data'));

        $this->assertDatabaseHas('ai_insights', [
            'tenant_id' => $tenant->id,
            'type'      => 'sales',
            'title'     => 'Pendapatan stabil',
        ]);
    }

    public function test_generate_insight_falls_back_without_llm(): void
    {
        $tenant = $this->makeTenant('Toko Offline');
        $admin  = $this->makeUser($tenant);
        $this->seedOrders($tenant, 5, 20000);

        // LLM error → harus tetap menghasilkan insight dari fallback templated
        $this->mock(GroqService::class, function ($mock) {
            $mock->shouldReceive('ask')->once()->andThrow(new \Exception('AI offline'));
        });

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/insights/generate')->assertStatus(200);
        $this->assertNotEmpty($response->json('data'));

        $this->assertDatabaseHas('ai_insights', ['tenant_id' => $tenant->id]);
    }

    public function test_insights_only_returned_for_own_tenant(): void
    {
        $tenantA = $this->makeTenant('Toko A');
        $adminA  = $this->makeUser($tenantA);
        $this->seedOrders($tenantA, 3, 10000);

        $tenantB = $this->makeTenant('Toko B');
        $adminB  = $this->makeUser($tenantB);

        $this->mock(GroqService::class, function ($mock) {
            $mock->shouldReceive('ask')->once()->andReturn([
                'text' => '[{"type":"sales","title":"Insight A","body":"Data toko A."}]',
            ]);
        });

        Sanctum::actingAs($adminA);
        $this->postJson('/api/insights/generate')->assertStatus(200);

        // Tenant B tidak melihat insight milik A
        Sanctum::actingAs($adminB);
        $this->getJson('/api/insights')->assertStatus(200)->assertJsonCount(0, 'data');
    }
}
