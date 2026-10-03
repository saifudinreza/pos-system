<?php

beforeEach(fn () => $this->withoutThrottle());

it('logout tanpa Authorization dari origin asing ditolak 401', function () {
    $this->withHeaders(['Origin' => 'https://evil.com'])
        ->withCookie('laravel_session', 'sesi-palsu')
        ->postJson('/api/logout')
        ->assertStatus(401);
});

it('update profil dari origin asing tanpa token ditolak', function () {
    $this->withHeaders(['Origin' => 'https://evil.com'])
        ->withCookie('laravel_session', 'sesi-palsu')
        ->putJson('/api/profile', ['name' => 'Diubah Penyerang'])
        ->assertStatus(401);
});

it('update profil dari origin asing dengan token valid dicatat perilakunya', function () {
    $user  = $this->createFreshUser();
    $token = $this->loginAs($user->email, $this->validPassword())->json('data.token');

    $response = $this->requestWithToken('PUT', '/api/profile', $token, ['name' => 'Nama Baru'], ['Origin' => 'https://evil.com']);

    $this->observe('CSRF-02', $response->getStatusCode());
    expect($response->getStatusCode())->toBeIn([200, 401, 403]);
});

it('origin frontend tanpa token tidak ter-autentikasi lewat session', function () {
    $this->withHeaders(['Origin' => 'http://localhost:3000', 'Referer' => 'http://localhost:3000/dashboard'])
        ->getJson('/api/me')
        ->assertStatus(401);
});

it('preflight CORS tidak menggabungkan wildcard origin dengan credentials', function () {
    $response = $this->call('OPTIONS', '/api/login', [], [], [], [
        'HTTP_ORIGIN'                        => 'https://evil.com',
        'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
    ]);

    $origin      = $response->headers->get('Access-Control-Allow-Origin');
    $credentials = $response->headers->get('Access-Control-Allow-Credentials');
    $this->observe('CSRF-04', ['status' => $response->getStatusCode(), 'allow_origin' => $origin, 'allow_credentials' => $credentials]);

    expect($origin === '*' && $credentials === 'true')->toBeFalse();
});

it('login dari origin asing dicatat perilakunya', function () {
    $user = $this->createFreshUser();

    $response = $this->withHeaders(['Origin' => 'https://evil.com'])
        ->loginAs($user->email, $this->validPassword());

    $this->observe('CSRF-05', $response->getStatusCode());
    expect($response->getStatusCode())->toBeIn([200, 403]);
});
