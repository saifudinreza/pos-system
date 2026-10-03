<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Hanya SATU email (config kasirai.developer_email) yang boleh berperan developer.
 */
class SingleDeveloperTest extends TestCase
{
    use RefreshDatabase;

    private function official(): User
    {
        return User::factory()->create([
            'tenant_id' => null,
            'role'      => 'developer',
            'email'     => User::developerEmail(),
            'is_active' => true,
        ]);
    }

    public function test_default_developer_email_is_owner(): void
    {
        $this->assertSame('donojomi@gmail.com', User::developerEmail());
    }

    public function test_email_comparison_is_case_insensitive(): void
    {
        $this->assertTrue(User::isDeveloperEmail('  DonojoMI@Gmail.com '));
        $this->assertFalse(User::isDeveloperEmail('lain@gmail.com'));
        $this->assertFalse(User::isDeveloperEmail(null));
    }

    public function test_official_developer_is_allowed(): void
    {
        Sanctum::actingAs($this->official());

        $this->getJson('/api/me')->assertStatus(200);
        $this->getJson('/api/dev/tenants')->assertStatus(200);
    }

    public function test_impostor_developer_is_locked_out(): void
    {
        $impostor = User::factory()->create([
            'tenant_id' => null, 'role' => 'developer', 'email' => 'penyusup@example.com',
        ]);
        Sanctum::actingAs($impostor);

        $this->getJson('/api/me')->assertStatus(403);
        $this->getJson('/api/dev/tenants')->assertStatus(403);
    }

    public function test_cannot_create_developer_for_other_email(): void
    {
        Sanctum::actingAs($this->official());

        $this->postJson('/api/users', [
            'name' => 'X', 'email' => 'x@example.com', 'role' => 'developer',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'x@example.com']);
    }

    public function test_cannot_promote_other_user_to_developer(): void
    {
        Sanctum::actingAs($this->official());
        $tenant = Tenant::create(['name' => 'T', 'slug' => 't']);
        $user = User::factory()->create(['tenant_id' => $tenant->id, 'role' => 'admin']);

        $this->patchJson("/api/users/{$user->id}/role", ['role' => 'developer'])->assertStatus(422);
        $this->putJson("/api/users/{$user->id}", ['role' => 'developer'])->assertStatus(422);

        $this->assertSame('admin', $user->fresh()->role);
    }

    public function test_official_developer_cannot_change_own_email_away(): void
    {
        $dev = $this->official();
        Sanctum::actingAs($dev);

        $this->putJson("/api/users/{$dev->id}", ['email' => 'baru@example.com'])->assertStatus(422);

        $this->assertSame(User::developerEmail(), $dev->fresh()->email);
    }

    public function test_official_developer_cannot_be_demoted_or_deactivated(): void
    {
        $dev = $this->official();
        Sanctum::actingAs($dev);

        $this->putJson("/api/users/{$dev->id}", ['role' => 'admin'])->assertStatus(422);
        $this->putJson("/api/users/{$dev->id}", ['is_active' => false])->assertStatus(422);

        $dev->refresh();
        $this->assertSame('developer', $dev->role);
        $this->assertTrue((bool) $dev->is_active);
    }

    public function test_audit_command_flags_impostor(): void
    {
        $this->official();
        $this->artisan('kasirai:developer-audit')->assertExitCode(0);

        User::factory()->create(['tenant_id' => null, 'role' => 'developer', 'email' => 'penyusup@example.com']);
        $this->artisan('kasirai:developer-audit')->assertExitCode(1);
    }

    public function test_seeder_does_not_reset_existing_developer_password(): void
    {
        $dev = $this->official();
        $hash = $dev->password;

        $this->seed(\Database\Seeders\UserSeeder::class);

        $this->assertSame($hash, $dev->fresh()->password);
    }
}
