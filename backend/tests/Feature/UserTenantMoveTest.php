<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserTenantMoveTest extends TestCase
{
    use RefreshDatabase;

    public function test_developer_can_move_user_between_tenants(): void
    {
        $tenantA = Tenant::create(['name' => 'Toko A', 'slug' => 'toko-a']);
        $tenantB = Tenant::create(['name' => 'Toko B', 'slug' => 'toko-b']);

        $dev    = User::factory()->create(['tenant_id' => null, 'role' => 'developer']);
        $user   = User::factory()->create(['tenant_id' => $tenantA->id, 'role' => 'admin']);

        Sanctum::actingAs($dev);

        $response = $this->putJson("/api/users/{$user->id}", ['tenant_id' => $tenantB->id]);

        $response->assertOk()
            ->assertJsonPath('data.tenant_id', $tenantB->id);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'tenant_id' => $tenantB->id]);
    }

    public function test_non_developer_cannot_move_user_between_tenants(): void
    {
        $tenantA = Tenant::create(['name' => 'Toko A', 'slug' => 'toko-a']);
        $tenantB = Tenant::create(['name' => 'Toko B', 'slug' => 'toko-b']);

        $admin = User::factory()->create(['tenant_id' => $tenantA->id, 'role' => 'admin']);
        $user  = User::factory()->create(['tenant_id' => $tenantA->id, 'role' => 'kasir']);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/users/{$user->id}", ['tenant_id' => $tenantB->id]);

        $response->assertStatus(403);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'tenant_id' => $tenantA->id]);
    }

    public function test_moving_user_to_invalid_tenant_fails(): void
    {
        $tenantA = Tenant::create(['name' => 'Toko A', 'slug' => 'toko-a']);

        $dev  = User::factory()->create(['tenant_id' => null, 'role' => 'developer']);
        $user = User::factory()->create(['tenant_id' => $tenantA->id, 'role' => 'admin']);

        Sanctum::actingAs($dev);

        $response = $this->putJson("/api/users/{$user->id}", ['tenant_id' => 999]);

        $response->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'tenant_id' => $tenantA->id]);
    }
}
