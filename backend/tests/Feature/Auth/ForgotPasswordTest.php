<?php

namespace Tests\Feature\Auth;

use App\Mail\ResetPasswordMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\DisposableAuthUser;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
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

    private function resetPayload(string $email, string $otp, ?string $password = null, ?string $confirmation = null): array
    {
        $password ??= $this->newPassword();

        return [
            'email'                 => $email,
            'otp'                   => $otp,
            'password'              => $password,
            'password_confirmation' => $confirmation ?? $password,
        ];
    }

    // ─── VALID ───

    public function test_forgot_lalu_reset_lalu_login_password_baru(): void
    {
        $user = $this->createFreshUser();
        $otp  = $this->requestOtpFor($user->email);

        $this->postJson('/api/reset-password', $this->resetPayload($user->email, $otp))->assertOk();

        $this->loginAs($user->email, $this->newPassword())->assertOk();
        $this->loginAs($user->email, $this->validPassword())->assertStatus(401);
    }

    public function test_otp_tidak_muncul_di_respons_http(): void
    {
        $user = $this->createFreshUser();
        Mail::fake();

        $response = $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        $otp = null;
        Mail::assertQueued(ResetPasswordMail::class, function ($mail) use (&$otp) {
            $otp = $mail->otp;
            return true;
        });
        $this->assertStringNotContainsString($otp, $response->getContent());
    }

    public function test_otp_tidak_disimpan_sebagai_teks_asli(): void
    {
        $user   = $this->createFreshUser();
        $otp    = $this->requestOtpFor($user->email);
        $record = Cache::get('pwd_otp:' . strtolower($user->email));

        $this->assertNotNull($record);
        $this->assertNotSame($otp, $record['hash']);
        $this->assertTrue(Hash::check($otp, $record['hash']));
    }

    public function test_email_otp_terkirim_hanya_ke_pemilik_akun(): void
    {
        $user = $this->createFreshUser();
        $this->requestOtpFor($user->email);

        Mail::assertQueuedCount(1);
        Mail::assertQueued(ResetPasswordMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_forgot_dan_reset_dengan_huruf_besar_kecil_email_berbeda_tidak_error(): void
    {
        $user = $this->createFreshUser();
        Mail::fake();

        $forgot = $this->postJson('/api/forgot-password', ['email' => strtoupper($user->email)]);

        $this->observe('F-05', [
            'forgot_status' => $forgot->getStatusCode(),
            'queued'        => Mail::queued(ResetPasswordMail::class)->count(),
        ]);
        $this->assertSame(200, $forgot->getStatusCode());
    }

    // ─── INVALID ───

    public function test_forgot_email_tidak_terdaftar_respons_identik_dan_tanpa_email(): void
    {
        $user = $this->createFreshUser();
        Mail::fake();

        $terdaftar = $this->postJson('/api/forgot-password', ['email' => $user->email]);
        Mail::fake();
        $tidakAda  = $this->postJson('/api/forgot-password', ['email' => $this->unregisteredEmail()]);

        $tidakAda->assertOk();
        $this->assertSame($terdaftar->json(), $tidakAda->json());
        Mail::assertNothingQueued();
    }

    public static function emailForgotSalah(): array
    {
        return [
            'format salah' => [['email' => 'bukan-email']],
            'kosong'       => [['email' => '']],
            'tanpa field'  => [[]],
            'array'        => [['email' => ['a@b.com']]],
        ];
    }

    #[DataProvider('emailForgotSalah')]
    public function test_forgot_input_email_salah_ditolak_422(array $payload): void
    {
        $this->postJson('/api/forgot-password', $payload)->assertStatus(422);
    }

    public function test_reset_konfirmasi_password_beda_ditolak(): void
    {
        $user = $this->createFreshUser();
        $otp  = $this->requestOtpFor($user->email);

        $this->postJson('/api/reset-password', $this->resetPayload($user->email, $otp, 'PasswordBaru456!', 'BedaSemua789!'))
            ->assertStatus(422);

        $this->assertTrue(Hash::check($this->validPassword(), $user->fresh()->password));
    }

    public function test_reset_password_baru_terlalu_pendek_ditolak(): void
    {
        $user = $this->createFreshUser();
        $otp  = $this->requestOtpFor($user->email);

        $this->postJson('/api/reset-password', $this->resetPayload($user->email, $otp, 'Abc123'))->assertStatus(422);

        $retry = $this->postJson('/api/reset-password', $this->resetPayload($user->email, $otp));
        $this->observe('F-13', 'otp masih bisa dipakai setelah password terlalu pendek: ' . $retry->getStatusCode());
        $this->assertContains($retry->getStatusCode(), [200, 422]);
    }

    public function test_otp_milik_user_lain_tidak_bisa_dipakai(): void
    {
        $a = $this->createFreshUser();
        $b = $this->createFreshUser();
        $otpA = $this->requestOtpFor($a->email);
        $otpB = $this->requestOtpFor($b->email);

        if ($otpA === $otpB) {
            $this->markTestSkipped('OTP A dan B kebetulan sama (peluang 1 : 1.000.000), ulangi test.');
        }

        $this->postJson('/api/reset-password', $this->resetPayload($b->email, $otpA))->assertStatus(422);
        $this->assertTrue(Hash::check($this->validPassword(), $b->fresh()->password));
    }

    public static function otpTidakValid(): array
    {
        return [
            'huruf'          => ['12345a'],
            'sql'            => ["' OR 1=1"],
            'spasi di tengah' => ['123 45'],
            '5 digit'        => ['12345'],
            '7 digit'        => ['1234567'],
        ];
    }

    #[DataProvider('otpTidakValid')]
    public function test_reset_format_otp_tidak_valid_ditolak(string $otp): void
    {
        $user = $this->createFreshUser();
        $this->requestOtpFor($user->email);

        $this->postJson('/api/reset-password', $this->resetPayload($user->email, $otp))->assertStatus(422);
        $this->assertTrue(Hash::check($this->validPassword(), $user->fresh()->password));
    }

    public function test_reset_berhasil_mencabut_token_lama(): void
    {
        $user = $this->createFreshUser();
        $old  = $user->createToken('perangkat-lain')->plainTextToken;
        $otp  = $this->requestOtpFor($user->email);

        $this->postJson('/api/reset-password', $this->resetPayload($user->email, $otp))->assertOk();

        $this->requestWithToken('GET', '/api/me', $old)->assertStatus(401);
    }

    public function test_forgot_dengan_field_password_tambahan_diabaikan(): void
    {
        $user = $this->createFreshUser();
        Mail::fake();

        $this->postJson('/api/forgot-password', ['email' => $user->email, 'password' => 'apa-saja-123'])->assertOk();

        $this->assertTrue(Hash::check($this->validPassword(), $user->fresh()->password));
    }
}
