<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\DisposableAuthUser;
use Tests\TestCase;

class LoginTest extends TestCase
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

    // ─── VALID ───

    public function test_login_valid_mengembalikan_token(): void
    {
        $user = $this->createFreshUser();

        $this->loginAs($user->email, $this->validPassword())
            ->assertOk()
            ->assertJsonPath('message', 'Login berhasil.')
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJson(fn ($json) => $json->has('data.token')->etc());
    }

    public function test_respons_login_tidak_memuat_data_sensitif(): void
    {
        $user     = $this->createFreshUser();
        $response = $this->loginAs($user->email, $this->validPassword())->assertOk();

        $response->assertJsonMissingPath('data.user.password');
        $response->assertJsonMissingPath('data.user.remember_token');
        $response->assertJsonMissingPath('data.user.midtrans_server_key');
        $this->assertStringNotContainsString('$2y$', $response->getContent());
    }

    public function test_token_login_bisa_dipakai_untuk_me(): void
    {
        $user  = $this->createFreshUser();
        $token = $this->loginAs($user->email, $this->validPassword())->json('data.token');

        $this->requestWithToken('GET', '/api/me', $token)
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_login_ulang_membatalkan_token_lama(): void
    {
        $user = $this->createFreshUser();
        $old1 = $user->createToken('lama-1')->plainTextToken;
        $user->createToken('lama-2');

        $this->loginAs($user->email, $this->validPassword())->assertOk();

        $this->assertSame(1, $user->tokens()->count());
        $this->requestWithToken('GET', '/api/me', $old1)->assertStatus(401);
    }

    public function test_login_email_huruf_besar_tidak_menyebabkan_error_server(): void
    {
        $user     = $this->createFreshUser();
        $response = $this->loginAs(strtoupper($user->email), $this->validPassword());

        $this->observe('L-05', $response->getStatusCode());
        $this->assertContains($response->getStatusCode(), [200, 401]);
    }

    public function test_login_email_dengan_spasi_di_tepi_tetap_berhasil(): void
    {
        $user = $this->createFreshUser();

        $this->loginAs('  ' . $user->email . '  ', $this->validPassword())->assertOk();
    }

    // ─── INVALID ───

    public function test_login_password_salah_ditolak_401(): void
    {
        $user = $this->createFreshUser();

        $this->loginAs($user->email, $this->wrongPassword())
            ->assertStatus(401)
            ->assertJsonPath('message', 'Email atau password salah.');
    }

    public function test_login_email_tidak_terdaftar_pesan_sama_dengan_password_salah(): void
    {
        $user = $this->createFreshUser();

        $salahPassword = $this->loginAs($user->email, $this->wrongPassword());
        $tidakAda      = $this->loginAs($this->unregisteredEmail(), $this->wrongPassword());

        $tidakAda->assertStatus(401);
        $this->assertSame($salahPassword->json(), $tidakAda->json());
    }

    public function test_login_email_kosong_ditolak_422(): void
    {
        $this->postJson('/api/login', ['password' => $this->validPassword()])
            ->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_login_password_kosong_ditolak_422(): void
    {
        $this->postJson('/api/login', ['email' => $this->uniqueEmail()])
            ->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    public function test_login_body_kosong_ditolak_422(): void
    {
        $this->postJson('/api/login', [])
            ->assertStatus(422)->assertJsonValidationErrors(['email', 'password']);
    }

    public static function emailFormatSalah(): array
    {
        return [
            'tanpa at'         => ['bukan-email'],
            'tanpa domain'     => ['a@'],
            'tanpa local part' => ['@b.com'],
            'ada spasi'        => ['a b@c.com'],
        ];
    }

    #[DataProvider('emailFormatSalah')]
    public function test_login_format_email_salah_ditolak_422(string $email): void
    {
        $this->postJson('/api/login', ['email' => $email, 'password' => $this->validPassword()])
            ->assertStatus(422);
    }

    public static function tipeDataSalah(): array
    {
        return [
            'email array'   => [['email' => ['a@b.com'], 'password' => 'Rahasia123!']],
            'password int'  => [['email' => 'a@b.com', 'password' => 12345678]],
            'password null' => [['email' => 'a@b.com', 'password' => null]],
        ];
    }

    #[DataProvider('tipeDataSalah')]
    public function test_login_tipe_data_salah_ditolak_422_bukan_500(array $payload): void
    {
        $this->postJson('/api/login', $payload)->assertStatus(422);
    }

    public function test_login_akun_nonaktif_password_benar_403(): void
    {
        $user = $this->createFreshUser(['is_active' => false]);

        $this->loginAs($user->email, $this->validPassword())
            ->assertStatus(403)
            ->assertJsonPath('message', 'Akun kamu dinonaktifkan. Hubungi admin.');
    }

    public function test_login_akun_nonaktif_password_salah_tetap_401(): void
    {
        $user = $this->createFreshUser(['is_active' => false]);

        $this->loginAs($user->email, $this->wrongPassword())->assertStatus(401);
    }

    public function test_login_password_beda_huruf_besar_kecil_401(): void
    {
        $user = $this->createFreshUser();

        $this->loginAs($user->email, strtolower($this->validPassword()))->assertStatus(401);
    }

    public function test_login_tanpa_header_json_tidak_menyebabkan_error_server(): void
    {
        $response = $this->post('/api/login', ['email' => 'bukan-email', 'password' => 'x']);

        $this->observe('L-20', $response->getStatusCode());
        $this->assertLessThan(500, $response->getStatusCode());
    }
}
