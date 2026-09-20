<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        $tenant = Tenant::create(['name' => 'Toko Reset', 'slug' => 'toko-reset-' . str()->random(6)]);

        return User::factory()->create([
            'tenant_id' => $tenant->id,
            'role'      => 'admin',
            'password'  => Hash::make('rahasia123'),
        ]);
    }

    /** Minta OTP lewat endpoint, lalu ambil kodenya dari email yang di-queue. */
    private function requestOtp(User $user): string
    {
        Mail::fake();
        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        $otp = null;
        Mail::assertQueued(ResetPasswordMail::class, function ($mail) use (&$otp) {
            $otp = $mail->otp;
            return true;
        });

        return $otp;
    }

    private function resetPayload(User $user, string $otp, string $password = 'passwordBaru123'): array
    {
        return [
            'email'                 => $user->email,
            'otp'                   => $otp,
            'password'              => $password,
            'password_confirmation' => $password,
        ];
    }

    // ─── FORGOT PASSWORD ───

    public function test_forgot_password_mengirim_otp_6_digit_ke_user_terdaftar(): void
    {
        $user = $this->makeUser();
        $otp  = $this->requestOtp($user);

        $this->assertMatchesRegularExpression('/^\d{6}$/', $otp);
        Mail::assertQueued(ResetPasswordMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_forgot_password_email_tidak_terdaftar_tetap_ok_tanpa_mengirim_email(): void
    {
        Mail::fake();

        $this->postJson('/api/forgot-password', ['email' => 'tidak-ada@contoh.com'])
            ->assertOk();

        Mail::assertNothingQueued();
        Mail::assertNothingSent();
    }

    public function test_forgot_password_email_format_salah_ditolak(): void
    {
        $this->postJson('/api/forgot-password', ['email' => 'bukan-email'])
            ->assertStatus(422);
    }

    public function test_kirim_ulang_dalam_60_detik_tidak_mengirim_email_kedua(): void
    {
        Mail::fake();
        $user = $this->makeUser();

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

        Mail::assertQueuedCount(1);
    }

    // ─── RESET PASSWORD ───

    public function test_reset_password_otp_valid_mengganti_password(): void
    {
        $user = $this->makeUser();
        $otp  = $this->requestOtp($user);

        $this->postJson('/api/reset-password', $this->resetPayload($user, $otp))
            ->assertOk()
            ->assertJsonPath('message', 'Password berhasil diganti. Silakan login dengan password baru.');

        $user->refresh();
        $this->assertTrue(Hash::check('passwordBaru123', $user->password));
        $this->assertFalse(Hash::check('rahasia123', $user->password));
    }

    public function test_reset_password_otp_salah_ditolak(): void
    {
        $user = $this->makeUser();
        $otp  = $this->requestOtp($user);
        $salah = $otp === '000000' ? '111111' : '000000';

        $this->postJson('/api/reset-password', $this->resetPayload($user, $salah))
            ->assertStatus(422);

        $this->assertTrue(Hash::check('rahasia123', $user->fresh()->password));
    }

    public function test_reset_password_tanpa_meminta_otp_ditolak(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/reset-password', $this->resetPayload($user, '123456'))
            ->assertStatus(422);
    }

    public function test_otp_hangus_setelah_5_kali_salah_walau_akhirnya_benar(): void
    {
        // Throttle IP (5/menit) sengaja dimatikan agar yang teruji murni logika OTP hangus
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);

        $user  = $this->makeUser();
        $otp   = $this->requestOtp($user);
        $salah = $otp === '000000' ? '111111' : '000000';

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/reset-password', $this->resetPayload($user, $salah))
                ->assertStatus(422);
        }

        $this->postJson('/api/reset-password', $this->resetPayload($user, $otp))
            ->assertStatus(422);
        $this->assertTrue(Hash::check('rahasia123', $user->fresh()->password));
    }

    public function test_otp_kedaluwarsa_setelah_10_menit(): void
    {
        $user = $this->makeUser();
        $otp  = $this->requestOtp($user);

        $this->travel(11)->minutes();

        $this->postJson('/api/reset-password', $this->resetPayload($user, $otp))
            ->assertStatus(422);
    }

    public function test_reset_password_mencabut_semua_sesi_login_lama(): void
    {
        $user = $this->makeUser();
        $user->createToken('sesi-lama-1');
        $user->createToken('sesi-lama-2');
        $otp = $this->requestOtp($user);

        $this->postJson('/api/reset-password', $this->resetPayload($user, $otp))
            ->assertOk();

        $this->assertCount(0, $user->tokens()->get());
    }

    public function test_otp_hanya_bisa_dipakai_sekali(): void
    {
        $user    = $this->makeUser();
        $otp     = $this->requestOtp($user);
        $payload = $this->resetPayload($user, $otp);

        $this->postJson('/api/reset-password', $payload)->assertOk();
        $this->postJson('/api/reset-password', $payload)->assertStatus(422);
    }

    public function test_otp_harus_6_digit_angka(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/reset-password', $this->resetPayload($user, 'abc'))
            ->assertStatus(422);
    }
}
