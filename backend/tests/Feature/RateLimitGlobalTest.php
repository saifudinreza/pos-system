<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RateLimitGlobalTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(): Tenant
    {
        return Tenant::create(['name' => 'Toko Rate', 'slug' => 'toko-rate-' . str()->random(6)]);
    }

    private function makeUser(Tenant $tenant, string $role = 'admin'): User
    {
        return User::factory()->create(['tenant_id' => $tenant->id, 'role' => $role]);
    }

    // ── Limiter 'api' terdefinisi & mengecualikan endpoint kritikal ──

    public function test_api_limiter_is_registered(): void
    {
        $this->assertNotNull(app('Illuminate\Cache\RateLimiter')->limiter('api'));
    }

    public function test_webhook_media_and_ai_polling_are_exempt(): void
    {
        $api       = app('Illuminate\Foundation\Application')->make('Illuminate\Cache\RateLimiter');
        $limiter   = $api->limiter('api');
        $treatPath = fn (string $path) => $limiter(\Illuminate\Http\Request::create('/' . $path, 'GET'));

        foreach ([
            'api/webhook/midtrans',
            'api/webhook/midtrans-subscription',
            'api/media/products/1.jpg',
            'api/ai/jobs/123',
            'api/ai/usage-today',
        ] as $path) {
            $limit = $treatPath($path);
            $this->assertInstanceOf(
                \Illuminate\Cache\RateLimiting\Unlimited::class,
                $limit,
                "Path {$path} harus dikecualikan dari throttle global (Unlimited)"
            );
        }
    }

    // ── Endpoint biasa kena throttle global ──

    public function test_authenticated_endpoint_blokir_setelah_120_request(): void
    {
        $tenant = $this->makeTenant();
        $user   = $this->makeUser($tenant);
        Sanctum::actingAs($user);

        $checked = false;
        for ($i = 0; $i < 125; $i++) {
            $response = $this->getJson('/api/me');
            if ($response->getStatusCode() === 429) {
                $checked = true;
                break;
            }
        }

        $this->assertTrue($checked, 'Harus ada 429 setelah melewati limit global 120/menit per user');
    }

    public function test_public_login_route_still_throttled(): void
    {
        // /api/login sendiri sudah throttle:5,1 -> setelah 5x harus 429
        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/api/login', ['email' => 'x@x.com', 'password' => 'wrong']);
        }

        $this->assertEquals(429, $response->getStatusCode());
    }

    public function test_exempt_media_still_reachable_under_burst(): void
    {
        // Media proxy di-exempt -> request loop tidak boleh 429
        $hit = false;
        for ($i = 0; $i < 150; $i++) {
            $response = $this->getJson('/api/media/not-found-' . $i . '.jpg');
            if ($response->getStatusCode() === 429) {
                $hit = true;
                break;
            }
        }

        $this->assertFalse($hit, 'Media proxy tidak boleh kena throttle global');
    }
}