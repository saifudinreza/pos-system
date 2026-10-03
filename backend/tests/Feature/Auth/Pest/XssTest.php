<?php

use App\Mail\ResetPasswordMail;
use Illuminate\Support\Facades\Mail;

beforeEach(fn () => $this->withoutThrottle());

$xssPayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg onload=alert(1)>',
    'javascript:alert(1)',
    '<a href="https://evil.com">Klik di sini</a>',
    '{{ 7*7 }}',
    "{!! '<b>x</b>' !!}",
];

it('payload xss di name dan store_name tersimpan apa adanya', function (string $payload) {
    $email = $this->uniqueEmail();

    $this->registerFreshUserViaApi(['email' => $email, 'name' => $payload, 'store_name' => $payload])
        ->assertStatus(201);

    $this->assertDatabaseHas('users', ['email' => $email, 'name' => $payload]);
})->with($xssPayloads);

it('respons api berformat json dan payload ter-encode', function (string $payload) {
    $response = $this->registerFreshUserViaApi(['name' => $payload])->assertStatus(201);

    expect($response->headers->get('Content-Type'))->toContain('application/json');
    expect($response->json('data.user.name'))->toBe($payload);
    expect($response->getContent())->not->toStartWith('<');
})->with($xssPayloads);

it('email reset password meng-escape nama user', function (string $payload) {
    $user = $this->createFreshUser(['name' => $payload]);
    Mail::fake();

    $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

    $html = null;
    Mail::assertQueued(ResetPasswordMail::class, function ($mail) use (&$html) {
        $html = $mail->render();
        return true;
    });

    expect($html)->toContain('<strong>' . e($payload) . '</strong>');
    if (str_contains($payload, '<')) {
        expect($html)->not->toContain($payload);
    }
    expect($html)->not->toContain('<strong>49</strong>');
})->with($xssPayloads);

it('check-tenant dengan payload xss membalas json', function (string $payload) {
    $response = $this->getJson('/api/check-tenant?name=' . urlencode($payload));

    $response->assertOk()->assertJsonPath('exists', false);
    expect($response->headers->get('Content-Type'))->toContain('application/json');
})->with($xssPayloads);
