<?php

use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

beforeEach(fn () => $this->withoutThrottle());

it('login valid mengembalikan token dan data user', function () {
    $user = $this->createFreshUser();

    $this->loginAs($user->email, $this->validPassword())
        ->assertOk()
        ->assertJsonPath('message', 'Login berhasil.')
        ->assertJsonPath('data.user.email', $user->email)
        ->assertJson(fn ($json) => $json->has('data.token')->etc());
});

it('register valid membuat akun baru dan password ter-hash', function () {
    $email = $this->uniqueEmail();

    $this->registerFreshUserViaApi(['email' => $email, 'phone' => '081234567890'])
        ->assertStatus(201)
        ->assertJsonPath('data.user.role', 'admin')
        ->assertJsonPath('data.is_new_store', true);

    $user = User::withoutGlobalScopes()->where('email', $email)->first();
    expect(Hash::check($this->validPassword(), $user->password))->toBeTrue();
});

it('forgot password valid lalu reset mengganti password', function () {
    $user = $this->createFreshUser();
    $otp  = $this->requestOtpFor($user->email);

    Mail::assertQueued(ResetPasswordMail::class, fn ($mail) => $mail->hasTo($user->email));

    $this->postJson('/api/reset-password', [
        'email'                 => $user->email,
        'otp'                   => $otp,
        'password'              => $this->newPassword(),
        'password_confirmation' => $this->newPassword(),
    ])->assertOk();

    $this->loginAs($user->email, $this->newPassword())->assertOk();
});
