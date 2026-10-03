<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\DisposableAuthUser;
use Tests\TestCase;

class TokenExpiryTest extends TestCase
{
    use RefreshDatabase, DisposableAuthUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSafeTestDatabase();
        $this->withoutThrottle();
    }

    protected function tearDown(): void
    {
        $this->cleanupCreatedUsers();
        parent::tearDown();
    }

    public function test_token_dengan_expires_at_masa_lalu_ditolak(): void
    {
        $user  = $this->createFreshUser();
        $token = $user->createToken('t', ['*'], now()->subMinute())->plainTextToken;

        $this->requestWithToken('GET', '/api/me', $token)->assertStatus(401);
    }

    public function test_token_ditolak_setelah_lewat_expires_at(): void
    {
        $user  = $this->createFreshUser();
        $token = $user->createToken('t', ['*'], now()->addHour())->plainTextToken;

        $this->requestWithToken('GET', '/api/me', $token)->assertOk();

        $this->travel(2)->hours();

        $this->requestWithToken('GET', '/api/me', $token)->assertStatus(401);
    }

    public function test_token_login_kedaluwarsa_bila_config_expiration_diaktifkan(): void
    {
        config(['sanctum.expiration' => 60]);
        $user  = $this->createFreshUser();
        $token = $this->loginAs($user->email, $this->validPassword())->json('data.token');

        $this->requestWithToken('GET', '/api/me', $token)->assertOk();

        $this->travel(61)->minutes();

        $this->requestWithToken('GET', '/api/me', $token)->assertStatus(401);
    }

    public function test_logout_dengan_token_kedaluwarsa_401_bukan_500(): void
    {
        $user  = $this->createFreshUser();
        $token = $user->createToken('t', ['*'], now()->subMinute())->plainTextToken;

        $this->requestWithToken('POST', '/api/logout', $token)->assertStatus(401);
    }

    public function test_respons_401_berformat_json(): void
    {
        $this->requestWithToken('GET', '/api/me', null, [], ['Accept' => 'application/json'])
            ->assertStatus(401)
            ->assertExactJson(['message' => 'Unauthenticated.']);
    }
}
