<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
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

    private function resetPayload(User $user, string $token, string $password = 'passwordBaru123'): array
    {
        return [
            'email'                 => $user->email,
            'token'                 => $token,
            'password'              => $password,
            'password_confirmation' => $password,
        ];
    }

    // ─── FORGOT PASSWORD ───

    public function test_forgot_password_mengirim_email_ke_user_terdaftar(): void
    {
        Mail::fake();
        $user = $this->makeUser();

        $this->postJson('/api/forgot-password', ['email' => $user->email])
            ->assertOk();

        Mail::assertSent(ResetPasswordMail::class, fn ($mail) => $mail->hasTo($user->email));
    }

    public function test_forgot_password_email_tidak_terdaftar_tetap_ok_tanpa_mengirim_email(): void
    {
        Mail::fake();

        $this->postJson('/api/forgot-password', ['email' => 'tidak-ada@contoh.com'])
            ->assertOk();

        Mail::assertNothingSent();
    }

    public function test_forgot_password_email_format_salah_ditolak(): void
    {
        $this->postJson('/api/forgot-password', ['email' => 'bukan-email'])
            ->assertStatus(422);
    }

    // ─── RESET PASSWORD ───

    public function test_reset_password_token_valid_mengganti_password(): void
    {
        $user  = $this->makeUser();
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/reset-password', $this->resetPayload($user, $token))
            ->assertOk()
            ->assertJsonPath('message', 'Password berhasil diganti. Silakan login dengan password baru.');

        $user->refresh();
        $this->assertTrue(Hash::check('passwordBaru123', $user->password));
        $this->assertFalse(Hash::check('rahasia123', $user->password));
    }

    public function test_reset_password_token_palsu_ditolak(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/reset-password', $this->resetPayload($user, 'token-palsu'))
            ->assertStatus(422);
    }

    public function test_reset_password_mencabut_semua_sesi_login_lama(): void
    {
        $user = $this->makeUser();
        $user->createToken('sesi-lama-1');
        $user->createToken('sesi-lama-2');
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/reset-password', $this->resetPayload($user, $token))
            ->assertOk();

        $this->assertCount(0, $user->tokens()->get());
    }

    public function test_token_reset_hanya_bisa_dipakai_sekali(): void
    {
        $user    = $this->makeUser();
        $token   = Password::broker()->createToken($user);
        $payload = $this->resetPayload($user, $token);

        $this->postJson('/api/reset-password', $payload)->assertOk();
        $this->postJson('/api/reset-password', $payload)->assertStatus(422);
    }
}