<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\DisposableAuthUser;
use Tests\TestCase;

class InputBoundaryTest extends TestCase
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

    /** Email dengan panjang tepat $length; local part 64 karakter + label domain maks 63 (batas RFC). */
    private function emailOfLength(int $length): string
    {
        $local  = str_replace('-', '', (string) \Illuminate\Support\Str::uuid()) . str_repeat('a', 32);
        $domain = str_repeat('b', $length - 65);
        for ($i = 63; $i < strlen($domain) - 1; $i += 64) {
            $domain[$i] = '.';
        }

        return $local . '@' . $domain;
    }

    private function assertNothingCreated(callable $send): void
    {
        $users   = User::withoutGlobalScopes()->count();
        $tenants = Tenant::withoutGlobalScopes()->count();

        $send();

        $this->assertSame($users, User::withoutGlobalScopes()->count());
        $this->assertSame($tenants, Tenant::withoutGlobalScopes()->count());
    }

    // ─── 7.1 KARAKTER KHUSUS ───

    public static function specialChars(): array
    {
        $chars = [
            'petik tunggal'  => "'",
            'petik ganda'    => '"',
            'backslash'      => '\\',
            'backtick'       => '`',
            'titik koma'     => ';',
            'komentar sql'   => '--',
            'komentar blok'  => '/* */',
            'persen'         => '%',
            'underscore'     => '_',
            'kurung sudut'   => '<>',
            'ampersand'      => '&',
            'pipe'           => '|',
            'dolar'          => '$',
            'kurung kurawal' => '{}',
            'kurung siku'    => '[]',
            'newline'        => "\n",
            'crlf'           => "\r\n",
            'tab'            => "\t",
            'emoji'          => '😀🔥',
            'aksara'         => 'Ñandú Çağrı 日本語 العربية',
            'zero-width'     => "\u{200B}",
            'rtl override'   => "\u{202E}",
        ];

        return array_map(fn ($c) => [$c], $chars);
    }

    #[DataProvider('specialChars')]
    public function test_name_dengan_karakter_khusus_tersimpan_persis(string $c): void
    {
        $name  = "Budi {$c} Test";
        $email = $this->uniqueEmail();

        $response = $this->registerFreshUserViaApi(['name' => $name, 'email' => $email])->assertStatus(201);

        $this->assertDatabaseHas('users', ['email' => $email, 'name' => $name]);
        $token = $response->json('data.token');
        $this->requestWithToken('GET', '/api/me', $token)->assertOk()->assertJsonPath('data.name', $name);
    }

    #[DataProvider('specialChars')]
    public function test_store_name_dengan_karakter_khusus_tersimpan_persis(string $c): void
    {
        $store = "Toko {$c} Uji " . \Illuminate\Support\Str::random(5);

        $this->registerFreshUserViaApi(['store_name' => $store])->assertStatus(201);

        $this->assertDatabaseHas('tenants', ['name' => $store]);
        $this->assertNotEmpty(Tenant::withoutGlobalScopes()->where('name', $store)->value('slug'));
    }

    public function test_password_dengan_karakter_khusus_register_dan_login(): void
    {
        $password = 'Pa\'ss"w`o\\rd;--1';
        $email    = $this->uniqueEmail();

        $this->registerFreshUserViaApi(['email' => $email, 'password' => $password])->assertStatus(201);

        $this->loginAs($email, $password)->assertOk();
        $this->loginAs($email, str_replace("'", '', $password))->assertStatus(401);
        $this->loginAs($email, str_replace('\\', '', $password))->assertStatus(401);
    }

    public static function emailDenganKarakterKhusus(): array
    {
        return [["user'@x.com"], ['user"@x.com'], ['user`@x.com']];
    }

    #[DataProvider('emailDenganKarakterKhusus')]
    public function test_login_email_dengan_karakter_khusus_bukan_500(string $email): void
    {
        $response = $this->loginAs($email, $this->validPassword());

        $this->assertContains($response->getStatusCode(), [401, 422]);
    }

    public function test_null_byte_di_semua_field_bukan_500(): void
    {
        $this->assertLessThan(500, $this->loginAs("abc\0def@x.com", "pass\0word")->getStatusCode());

        $response = $this->registerFreshUserViaApi([
            'name'       => "abc\0def",
            'password'   => "Rahasia\0123!",
            'store_name' => "Toko\0Null " . \Illuminate\Support\Str::random(4),
        ]);
        $this->observe('C-05', $response->getStatusCode());
        $this->assertLessThan(500, $response->getStatusCode());

        $this->assertLessThan(500, $this->postJson('/api/forgot-password', ['email' => "abc\0@x.com"])->getStatusCode());
    }

    public function test_password_dengan_emoji_register_dan_login(): void
    {
        $email = $this->uniqueEmail();

        $this->registerFreshUserViaApi(['email' => $email, 'password' => 'Rahasia😀123'])->assertStatus(201);

        $this->loginAs($email, 'Rahasia😀123')->assertOk();
    }

    public function test_nama_toko_dengan_zero_width_tidak_menyebabkan_error_server(): void
    {
        $a = $this->registerFreshUserViaApi(['store_name' => 'Toko Mirip'])->assertStatus(201);
        $b = $this->registerFreshUserViaApi(['store_name' => "Toko\u{200B}Mirip"]);

        $this->observe('C-07', [
            'status_b'         => $b->getStatusCode(),
            'tenant_sama'      => $a->json('data.user.tenant_id') === $b->json('data.user.tenant_id'),
            'is_new_store_b'   => $b->json('data.is_new_store'),
        ]);
        $this->assertContains($b->getStatusCode(), [201, 422]);
    }

    // ─── 7.2 PANJANG DATA ───

    public function test_name_255_diterima_256_ditolak(): void
    {
        $this->registerFreshUserViaApi(['name' => str_repeat('a', 255)])->assertStatus(201);

        $this->assertNothingCreated(fn () => $this->postJson('/api/register', [
            'name' => str_repeat('a', 256), 'email' => $this->uniqueEmail(), 'password' => $this->validPassword(),
        ])->assertStatus(422)->assertJsonValidationErrors(['name']));
    }

    public function test_name_10000_ditolak_bukan_500(): void
    {
        $this->assertNothingCreated(fn () => $this->postJson('/api/register', [
            'name' => str_repeat('a', 10000), 'email' => $this->uniqueEmail(), 'password' => $this->validPassword(),
        ])->assertStatus(422));
    }

    public function test_email_panjang_wajar_diterima_dan_email_254_256_ditolak(): void
    {
        $this->assertSame(190, strlen($this->emailOfLength(190)));
        $this->registerFreshUserViaApi(['email' => $this->emailOfLength(190)])->assertStatus(201);

        foreach ([254, 256] as $length) {
            $this->assertNothingCreated(fn () => $this->postJson('/api/register', [
                'name' => 'Uji', 'email' => $this->emailOfLength($length), 'password' => $this->validPassword(),
            ])->assertStatus(422));
        }
    }

    public function test_store_name_255_diterima_256_ditolak(): void
    {
        $this->registerFreshUserViaApi(['store_name' => str_repeat('s', 255)])->assertStatus(201);

        $this->assertNothingCreated(fn () => $this->postJson('/api/register', [
            'name' => 'Uji', 'email' => $this->uniqueEmail(), 'password' => $this->validPassword(),
            'store_name' => str_repeat('s', 256),
        ])->assertStatus(422)->assertJsonValidationErrors(['store_name']));
    }

    public function test_phone_15_diterima_16_ditolak(): void
    {
        $this->registerFreshUserViaApi(['phone' => str_repeat('1', 15)])->assertStatus(201);

        $this->assertNothingCreated(fn () => $this->postJson('/api/register', [
            'name' => 'Uji', 'email' => $this->uniqueEmail(), 'password' => $this->validPassword(),
            'phone' => str_repeat('1', 16),
        ])->assertStatus(422)->assertJsonValidationErrors(['phone']));
    }

    public function test_password_72_karakter_register_dan_login(): void
    {
        $email    = $this->uniqueEmail();
        $password = str_repeat('a', 72);

        $this->registerFreshUserViaApi(['email' => $email, 'password' => $password])->assertStatus(201);

        $this->loginAs($email, $password)->assertOk();
    }

    public static function passwordPanjang(): array
    {
        return [[73], [100], [1000], [10000]];
    }

    #[DataProvider('passwordPanjang')]
    public function test_password_lebih_dari_72_karakter_bukan_500(int $length): void
    {
        $response = $this->registerFreshUserViaApi(['password' => str_repeat('a', $length)]);

        $this->observe("B-08/{$length}", $response->getStatusCode());
        $this->assertContains($response->getStatusCode(), [201, 422]);
    }

    public function test_password_multibyte_lebih_dari_72_byte_bukan_500(): void
    {
        $response = $this->registerFreshUserViaApi(['password' => str_repeat('😀', 72)]);

        $this->observe('B-09', $response->getStatusCode());
        $this->assertContains($response->getStatusCode(), [201, 422]);
    }

    public static function emailLoginPanjang(): array
    {
        return [[256], [10000]];
    }

    #[DataProvider('emailLoginPanjang')]
    public function test_login_email_panjang_bukan_500(int $length): void
    {
        $response = $this->loginAs($this->emailOfLength($length), $this->validPassword());

        $this->assertContains($response->getStatusCode(), [401, 422]);
    }

    public function test_login_password_1mb_bukan_500_dan_tidak_lambat(): void
    {
        $user  = $this->createFreshUser();
        $start = microtime(true);

        $response = $this->loginAs($user->email, str_repeat('p', 1024 * 1024));

        $elapsed = microtime(true) - $start;
        $this->observe('B-11', ['status' => $response->getStatusCode(), 'detik' => round($elapsed, 3)]);
        $this->assertContains($response->getStatusCode(), [401, 422]);
        $this->assertLessThan(2.0, $elapsed);
    }

    public function test_forgot_email_256_ditolak(): void
    {
        $this->postJson('/api/forgot-password', ['email' => $this->emailOfLength(256)])->assertStatus(422);
    }
}
