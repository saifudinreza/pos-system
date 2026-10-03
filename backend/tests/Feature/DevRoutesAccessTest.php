<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Developer Portal dijaga di SERVER: semua endpoint /api/dev/* hanya untuk
 * role developer (middleware role:developer). Halaman /dev/* di frontend
 * memverifikasi peran lewat GET /api/me (src/middleware.js), jadi test ini
 * memastikan kontrak yang dipakai kedua sisi tidak bocor.
 */
class DevRoutesAccessTest extends TestCase
{
    use RefreshDatabase;

    /** Endpoint portal developer yang harus tertutup untuk non-developer. */
    private const DEV_ENDPOINTS = ['/api/dev/tenants', '/api/dev/subscriptions'];

    private function userWithRole(string $role, bool $active = true): User
    {
        $tenant = Tenant::create(['name' => 'Toko ' . $role, 'slug' => 'toko-' . $role . '-' . str()->random(4)]);

        return User::factory()->create([
            'tenant_id' => $role === 'developer' ? null : $tenant->id,
            'role'      => $role,
            'is_active' => $active,
            // Hanya email resmi yang boleh berperan developer
            'email'     => $role === 'developer' ? User::developerEmail() : fake()->unique()->safeEmail(),
        ]);
    }

    public function test_guest_cannot_access_dev_endpoints(): void
    {
        foreach (self::DEV_ENDPOINTS as $url) {
            $this->getJson($url)->assertStatus(401);
        }
    }

    public function test_admin_kasir_and_user_are_forbidden_from_dev_endpoints(): void
    {
        foreach (['admin', 'kasir', 'user'] as $role) {
            Sanctum::actingAs($this->userWithRole($role));

            foreach (self::DEV_ENDPOINTS as $url) {
                $this->getJson($url)->assertStatus(403);
            }
        }
    }

    public function test_developer_can_access_dev_endpoints(): void
    {
        Sanctum::actingAs($this->userWithRole('developer'));

        foreach (self::DEV_ENDPOINTS as $url) {
            $this->getJson($url)->assertStatus(200);
        }
    }

    public function test_inactive_developer_is_blocked(): void
    {
        Sanctum::actingAs($this->userWithRole('developer', active: false));

        $this->getJson('/api/dev/tenants')->assertStatus(403);
    }

    public function test_me_exposes_role_and_active_flag_used_by_frontend_gate(): void
    {
        // Middleware frontend membaca data.role dan data.is_active dari GET /api/me
        Sanctum::actingAs($this->userWithRole('developer'));

        $this->getJson('/api/me')
            ->assertStatus(200)
            ->assertJsonPath('data.role', 'developer')
            ->assertJsonPath('data.is_active', true);
    }
}
