<?php

use App\Models\User;
use Illuminate\Support\Facades\Mail;

// Throttle SENGAJA aktif di file ini.

function bruteForceHammerLogin($test, string $email, int $times): array
{
    $statuses = [];
    for ($i = 0; $i < $times; $i++) {
        $statuses[] = $test->loginAs($email, $test->wrongPassword());
    }

    return $statuses;
}

it('lima login salah pertama dibalas 401', function () {
    $user = $this->createFreshUser();

    foreach (bruteForceHammerLogin($this, $user->email, 5) as $response) {
        expect($response->getStatusCode())->toBe(401);
    }
});

it('percobaan login ke-6 dibalas 429 dengan Retry-After', function () {
    $user = $this->createFreshUser();
    bruteForceHammerLogin($this, $user->email, 5);

    $response = $this->loginAs($user->email, $this->wrongPassword());

    $response->assertStatus(429);
    expect($response->headers->get('Retry-After'))->not->toBeNull();
});

it('password benar tetap 429 setelah kena limit', function () {
    $user = $this->createFreshUser();
    bruteForceHammerLogin($this, $user->email, 5);

    $this->loginAs($user->email, $this->validPassword())->assertStatus(429);
});

it('login berhasil lagi setelah jeda 61 detik', function () {
    $user = $this->createFreshUser();
    bruteForceHammerLogin($this, $user->email, 6);

    $this->travel(61)->seconds();

    $this->loginAs($user->email, $this->validPassword())->assertOk();
});

it('register ke-6 dari IP yang sama dibalas 429', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->registerFreshUserViaApi()->assertStatus(201);
    }

    $this->registerFreshUserViaApi()->assertStatus(429);
});

it('forgot-password ke-6 dari IP yang sama dibalas 429', function () {
    Mail::fake();

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/forgot-password', ['email' => $this->unregisteredEmail()])->assertOk();
    }

    $this->postJson('/api/forgot-password', ['email' => $this->unregisteredEmail()])->assertStatus(429);
});

it('tebakan reset-password ke-6 dibalas 429', function () {
    $user = $this->createFreshUser();
    $this->requestOtpFor($user->email);

    $payload = fn (string $otp) => [
        'email'                 => $user->email,
        'otp'                   => $otp,
        'password'              => $this->newPassword(),
        'password_confirmation' => $this->newPassword(),
    ];

    $statuses = [];
    foreach (['000001', '000002', '000003', '000004', '000005', '000006'] as $guess) {
        $statuses[] = $this->postJson('/api/reset-password', $payload($guess))->getStatusCode();
    }

    expect($statuses[5])->toBe(429);
});

it('header batas request tersedia pada respons login', function () {
    $user = $this->createFreshUser();

    $response = $this->loginAs($user->email, $this->wrongPassword());

    $this->observe('BF-08', [
        'limit'     => $response->headers->get('X-RateLimit-Limit'),
        'remaining' => $response->headers->get('X-RateLimit-Remaining'),
    ]);
    expect($response->headers->get('X-RateLimit-Limit'))->toBe('5');
});
