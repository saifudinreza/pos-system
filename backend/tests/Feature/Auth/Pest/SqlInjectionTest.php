<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

beforeEach(fn () => $this->withoutThrottle());

$sqlPayloads = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "' OR 1=1 #",
    "admin'--",
    '" OR ""="',
    "'; DROP TABLE users; --",
    "' UNION SELECT id, email, password FROM users --",
    "1' AND SLEEP(5) --",
    "' OR '1'='1' /*",
    "\\' OR 1=1 --",
    '%27%20OR%201%3D1',
];

it('payload sql di email login tidak menembus', function (string $payload) {
    $this->createFreshUser();

    $response = $this->loginAs($payload, 'apa-saja');

    expect($response->getStatusCode())->toBeIn([401, 422]);
})->with($sqlPayloads);

it('payload sql di password login ditolak 401', function (string $payload) {
    $user = $this->createFreshUser();

    $this->loginAs($user->email, $payload)->assertStatus(401);
})->with($sqlPayloads);

it('payload sql di name dan store_name tersimpan sebagai teks literal', function (string $payload) {
    $email = $this->uniqueEmail();

    $this->registerFreshUserViaApi(['email' => $email, 'name' => $payload, 'store_name' => $payload])
        ->assertStatus(201);

    $this->assertDatabaseHas('users', ['email' => $email, 'name' => $payload]);
    $this->assertDatabaseHas('tenants', ['name' => $payload]);
    expect(Schema::hasTable('users'))->toBeTrue();
})->with($sqlPayloads);

it('payload sql di check-tenant tidak mengembalikan tenant lain', function (string $payload) {
    $this->createFreshUser();

    $this->getJson('/api/check-tenant?name=' . urlencode($payload))
        ->assertOk()
        ->assertJsonPath('exists', false);
})->with($sqlPayloads);

it('payload sql di forgot email dan reset otp ditolak 422', function (string $payload) {
    $user = $this->createFreshUser();

    $this->postJson('/api/forgot-password', ['email' => $payload])->assertStatus(422);
    $this->postJson('/api/reset-password', [
        'email'                 => $user->email,
        'otp'                   => $payload,
        'password'              => $this->newPassword(),
        'password_confirmation' => $this->newPassword(),
    ])->assertStatus(422);
})->with($sqlPayloads);

it('payload sleep tidak membuat respons lambat', function () {
    $start = microtime(true);

    $this->loginAs("1' AND SLEEP(5) --", 'x');
    $this->loginAs('a@b.com', "1' AND SLEEP(5) --");

    expect(microtime(true) - $start)->toBeLessThan(2.0);
});

it('seluruh dataset tidak mengubah jumlah user', function () use ($sqlPayloads) {
    $user = $this->createFreshUser();
    $before = User::withoutGlobalScopes()->count();
    $tenants = Tenant::withoutGlobalScopes()->count();

    foreach ($sqlPayloads as $payload) {
        $this->loginAs($payload, $payload);
        $this->loginAs($user->email, $payload);
        $this->postJson('/api/forgot-password', ['email' => $payload]);
    }

    expect(Schema::hasTable('users'))->toBeTrue();
    expect(User::withoutGlobalScopes()->count())->toBe($before);
    expect(Tenant::withoutGlobalScopes()->count())->toBe($tenants);
});

it('AuthController tidak memakai query mentah', function () {
    $source = file_get_contents(app_path('Http/Controllers/Api/AuthController.php'));

    expect($source)->not->toMatch('/DB::raw|whereRaw|selectRaw|orderByRaw|DB::select|DB::statement/');
});
