<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\DisposableAuthUser;
use Tests\TestCase;

class RegisterTest extends TestCase
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

    /** Kirim register yang seharusnya ditolak 422 dan pastikan tidak ada baris baru di DB. */
    private function assertRegisterRejected(array $payload, array $errorKeys = []): void
    {
        $users   = User::withoutGlobalScopes()->count();
        $tenants = Tenant::withoutGlobalScopes()->count();

        $response = $this->postJson('/api/register', $payload)->assertStatus(422);
        if ($errorKeys) {
            $response->assertJsonValidationErrors($errorKeys);
        }

        $this->assertSame($users, User::withoutGlobalScopes()->count());
        $this->assertSame($tenants, Tenant::withoutGlobalScopes()->count());
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name'       => 'User Test',
            'email'      => $this->uniqueEmail(),
            'password'   => $this->validPassword(),
            'store_name' => 'Toko Test ' . \Illuminate\Support\Str::random(8),
        ], $overrides);
    }

    // ─── VALID ───

    public function test_register_lengkap_membuat_admin_dan_tenant_baru(): void
    {
        $payload  = $this->validPayload(['phone' => '081234567890']);
        $response = $this->registerFreshUserViaApi($payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.is_new_store', true)
            ->assertJsonPath('data.user.role', 'admin')
            ->assertJson(fn ($json) => $json->has('data.token')->etc());
        $this->assertDatabaseHas('tenants', ['name' => $payload['store_name']]);
        $this->assertDatabaseHas('users', ['email' => $payload['email'], 'phone' => '081234567890']);
    }

    public function test_register_tanpa_store_name_membuat_tenant_default(): void
    {
        $payload = $this->validPayload(['name' => 'Budi Test']);
        unset($payload['store_name']);

        $this->postJson('/api/register', $payload)->assertStatus(201);
        $this->trackUserByEmail($payload['email']);
        $this->assertDatabaseHas('tenants', ['name' => 'Toko Budi Test']);
    }

    public function test_password_tersimpan_ter_hash(): void
    {
        $payload = $this->validPayload();
        $this->registerFreshUserViaApi($payload)->assertStatus(201);

        $user = User::withoutGlobalScopes()->where('email', $payload['email'])->first();
        $this->assertNotSame($this->validPassword(), $user->password);
        $this->assertTrue(Hash::check($this->validPassword(), $user->password));
    }

    public function test_token_register_bisa_dipakai_untuk_me(): void
    {
        $token = $this->registerFreshUserViaApi()->assertStatus(201)->json('data.token');

        $this->requestWithToken('GET', '/api/me', $token)->assertOk();
    }

    public function test_register_dengan_nama_toko_yang_sudah_ada_menjadi_kasir(): void
    {
        $store = 'Toko Gabung ' . \Illuminate\Support\Str::random(6);
        $a = $this->registerFreshUserViaApi(['store_name' => $store])->assertStatus(201);
        $b = $this->registerFreshUserViaApi(['store_name' => $store])->assertStatus(201);

        $b->assertJsonPath('data.is_new_store', false)->assertJsonPath('data.user.role', 'kasir');
        $this->assertSame($a->json('data.user.tenant_id'), $b->json('data.user.tenant_id'));
    }

    public function test_batas_jumlah_kasir_per_toko(): void
    {
        $store = 'Toko Penuh ' . \Illuminate\Support\Str::random(6);
        $this->registerFreshUserViaApi(['store_name' => $store])->assertStatus(201);
        $this->registerFreshUserViaApi(['store_name' => $store])->assertStatus(201);
        $this->registerFreshUserViaApi(['store_name' => $store])->assertStatus(201);

        $this->postJson('/api/register', $this->validPayload(['store_name' => $store]))
            ->assertStatus(422)
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'batas maksimal kasir (2)'));
    }

    public function test_user_baru_mendapat_plan_free(): void
    {
        $this->registerFreshUserViaApi()->assertStatus(201)->assertJsonPath('data.user.subscription_plan', 'free');
    }

    public function test_password_tepat_8_karakter_diterima(): void
    {
        $this->registerFreshUserViaApi(['password' => 'Abcdef12'])->assertStatus(201);
    }

    // ─── INVALID ───

    public function test_email_sudah_terdaftar_ditolak(): void
    {
        $email = $this->uniqueEmail();
        $this->registerFreshUserViaApi(['email' => $email])->assertStatus(201);

        $this->assertRegisterRejected($this->validPayload(['email' => $email]), ['email']);
    }

    public function test_email_sama_beda_huruf_besar_kecil_tidak_menyebabkan_error_server(): void
    {
        $email = $this->uniqueEmail();
        $this->registerFreshUserViaApi(['email' => $email])->assertStatus(201);

        $response = $this->registerFreshUserViaApi(['email' => strtoupper($email)]);

        $this->observe('R-11', $response->getStatusCode());
        $this->assertContains($response->getStatusCode(), [201, 422]);
    }

    public static function emailFormatSalah(): array
    {
        return [['bukan-email'], ['a@'], ['@b.com'], ['a b@c.com']];
    }

    #[DataProvider('emailFormatSalah')]
    public function test_format_email_salah_ditolak(string $email): void
    {
        $this->assertRegisterRejected($this->validPayload(['email' => $email]), ['email']);
    }

    public function test_password_kurang_dari_8_karakter_ditolak(): void
    {
        $this->assertRegisterRejected($this->validPayload(['password' => 'Abc123']), ['password']);
    }

    public static function passwordTipeSalah(): array
    {
        return [
            'kosong'  => [''],
            'null'    => [null],
            'integer' => [12345678],
            'array'   => [['Rahasia123!']],
        ];
    }

    #[DataProvider('passwordTipeSalah')]
    public function test_password_tipe_atau_isi_salah_ditolak_422(mixed $password): void
    {
        $this->assertRegisterRejected($this->validPayload(['password' => $password]), ['password']);
    }

    public function test_name_kosong_ditolak(): void
    {
        $this->assertRegisterRejected($this->validPayload(['name' => '']), ['name']);
    }

    public function test_phone_16_karakter_ditolak(): void
    {
        $this->assertRegisterRejected($this->validPayload(['phone' => str_repeat('1', 16)]), ['phone']);
    }

    public function test_body_kosong_ditolak(): void
    {
        $this->assertRegisterRejected([], ['name', 'email', 'password']);
    }

    public function test_field_ekstra_tidak_bisa_menaikkan_hak_akses(): void
    {
        $payload = $this->validPayload([
            'role'              => 'developer',
            'tenant_id'         => 999,
            'subscription_plan' => 'enterprise',
            'is_active'         => true,
        ]);

        $response = $this->registerFreshUserViaApi($payload)->assertStatus(201);

        $user = User::withoutGlobalScopes()->where('email', $payload['email'])->first();
        $this->assertSame('admin', $user->role);
        $this->assertNotSame(999, $user->tenant_id);
        $this->assertSame($response->json('data.user.tenant_id'), $user->tenant_id);
        $this->assertSame('free', $user->subscription_plan);
    }

    public function test_store_name_hanya_spasi_tidak_menyebabkan_error_server(): void
    {
        $response = $this->registerFreshUserViaApi(['store_name' => '   ']);

        $this->observe('R-19', ['status' => $response->getStatusCode(), 'tenant' => $response->json('data.user.tenant_name')]);
        $this->assertContains($response->getStatusCode(), [201, 422]);
    }
}
