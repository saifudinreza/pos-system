<?php

use Illuminate\Support\Facades\Mail;

beforeEach(fn () => $this->withoutThrottle());

it('login: password salah dan email tidak terdaftar tidak bisa dibedakan', function () {
    $user = $this->createFreshUser();

    $terdaftar = $this->loginAs($user->email, $this->wrongPassword());
    $tidakAda  = $this->loginAs($this->unregisteredEmail(), $this->wrongPassword());

    expect($tidakAda->getStatusCode())->toBe($terdaftar->getStatusCode());
    expect($tidakAda->json())->toBe($terdaftar->json());
});

it('login: waktu respons dicatat', function () {
    $user = $this->createFreshUser();

    $time = function (string $email): float {
        $start = microtime(true);
        for ($i = 0; $i < 20; $i++) {
            $this->loginAs($email, $this->wrongPassword());
        }

        return (microtime(true) - $start) / 20;
    };

    $this->observe('AE-02', [
        'rata2_detik_email_terdaftar'       => round($time($user->email), 5),
        'rata2_detik_email_tidak_terdaftar' => round($time($this->unregisteredEmail()), 5),
    ]);

    expect(true)->toBeTrue();
});

it('login: akun nonaktif dengan password salah tidak bocor', function () {
    $nonaktif = $this->createFreshUser(['is_active' => false]);
    $aktif    = $this->createFreshUser();

    $a = $this->loginAs($nonaktif->email, $this->wrongPassword());
    $b = $this->loginAs($aktif->email, $this->wrongPassword());

    expect($a->getStatusCode())->toBe($b->getStatusCode());
    expect($a->json())->toBe($b->json());
});

it('forgot-password: email terdaftar dan tidak terdaftar dibalas identik', function () {
    $user = $this->createFreshUser();
    Mail::fake();

    $terdaftar = $this->postJson('/api/forgot-password', ['email' => $user->email]);
    $tidakAda  = $this->postJson('/api/forgot-password', ['email' => $this->unregisteredEmail()]);

    expect($tidakAda->getStatusCode())->toBe($terdaftar->getStatusCode());
    expect($tidakAda->json())->toBe($terdaftar->json());
});

it('reset-password: OTP salah untuk email terdaftar dan tidak terdaftar dibalas identik', function () {
    $user = $this->createFreshUser();
    $this->requestOtpFor($user->email);

    $body = fn (string $email) => [
        'email' => $email, 'otp' => '000000',
        'password' => $this->newPassword(), 'password_confirmation' => $this->newPassword(),
    ];

    $terdaftar = $this->postJson('/api/reset-password', $body($user->email));
    $tidakAda  = $this->postJson('/api/reset-password', $body($this->unregisteredEmail()));

    expect($tidakAda->getStatusCode())->toBe($terdaftar->getStatusCode());
    expect($tidakAda->json())->toBe($terdaftar->json());
});

it('register: pesan untuk email yang sudah terdaftar dicatat', function () {
    $email = $this->uniqueEmail();
    $this->registerFreshUserViaApi(['email' => $email])->assertStatus(201);

    $response = $this->registerFreshUserViaApi(['email' => $email]);

    $this->observe('AE-06', ['status' => $response->getStatusCode(), 'body' => $response->json()]);
    expect($response->getStatusCode())->toBe(422);
});

it('check-tenant: data yang dikembalikan tanpa login dicatat', function () {
    $user = $this->createFreshUser();
    $name = $user->tenant->name;

    $response = $this->getJson('/api/check-tenant?name=' . urlencode($name));

    $this->observe('AE-07', ['status' => $response->getStatusCode(), 'body' => $response->json()]);
    $response->assertOk()->assertJsonPath('exists', true);
});
