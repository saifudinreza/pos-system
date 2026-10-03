<?php

use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(fn () => $this->withoutThrottle());

function tokenTheftLogin($test, $user): string
{
    return $test->loginAs($user->email, $test->validPassword())->assertOk()->json('data.token');
}

it('token dari IP dan user-agent berbeda dicatat perilakunya', function () {
    $user  = $this->createFreshUser();
    $token = tokenTheftLogin($this, $user);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.9', 'HTTP_USER_AGENT' => 'Perangkat-Lain/1.0'])
        ->requestWithToken('GET', '/api/me', $token);

    $this->observe('TT-01', $response->getStatusCode());
    expect($response->getStatusCode())->toBeIn([200, 401, 403]);
});

it('token tidak berlaku setelah logout', function () {
    $user  = $this->createFreshUser();
    $token = tokenTheftLogin($this, $user);

    $this->requestWithToken('POST', '/api/logout', $token)->assertOk();

    $this->requestWithToken('GET', '/api/me', $token)->assertStatus(401);
});

it('token lama tidak berlaku setelah login ulang', function () {
    $user = $this->createFreshUser();
    $old  = tokenTheftLogin($this, $user);

    tokenTheftLogin($this, $user);

    $this->requestWithToken('GET', '/api/me', $old)->assertStatus(401);
});

it('token lama tidak berlaku setelah reset password', function () {
    $user = $this->createFreshUser();
    $old  = tokenTheftLogin($this, $user);
    $otp  = $this->requestOtpFor($user->email);

    $this->postJson('/api/reset-password', [
        'email'                 => $user->email,
        'otp'                   => $otp,
        'password'              => $this->newPassword(),
        'password_confirmation' => $this->newPassword(),
    ])->assertOk();

    $this->requestWithToken('GET', '/api/me', $old)->assertStatus(401);
});

it('token yang diubah satu karakter ditolak', function () {
    $user  = $this->createFreshUser();
    $token = tokenTheftLogin($this, $user);
    $last  = substr($token, -1);

    $tampered = substr($token, 0, -1) . ($last === 'a' ? 'b' : 'a');

    $this->requestWithToken('GET', '/api/me', $tampered)->assertStatus(401);
});

it('id token milik user lain dengan secret sendiri ditolak', function () {
    $a = $this->createFreshUser();
    $b = $this->createFreshUser();
    $tokenA = $a->createToken('a')->accessToken;
    $b->createToken('b');

    $forged = $tokenA->id . '|' . Str::random(40);

    $this->requestWithToken('GET', '/api/me', $forged)->assertStatus(401);
});

it('token satu tenant tidak melihat produk tenant lain', function () {
    $a = $this->createFreshUser();
    $b = $this->createFreshUser();

    foreach ([[$a, 'Produk Milik A', 'TTA1'], [$b, 'Produk Milik B', 'TTB1']] as [$owner, $name, $sku]) {
        $category = Category::create(['tenant_id' => $owner->tenant_id, 'name' => 'Kat ' . $sku, 'slug' => Str::slug('kat-' . $sku)]);
        Product::create([
            'tenant_id' => $owner->tenant_id, 'category_id' => $category->id,
            'name' => $name, 'sku' => $sku, 'price' => 1000, 'stock' => 5, 'is_active' => true,
        ]);
    }

    $token = tokenTheftLogin($this, $a);
    $names = collect($this->requestWithToken('GET', '/api/products', $token)->assertOk()->json('data'))->pluck('name');

    expect($names)->toContain('Produk Milik A');
    expect($names)->not->toContain('Produk Milik B');
});

it('token disimpan ter-hash di database', function () {
    $user  = $this->createFreshUser();
    $token = tokenTheftLogin($this, $user);
    $plain = explode('|', $token, 2)[1];

    $stored = DB::table('personal_access_tokens')->where('tokenable_id', $user->id)->value('token');

    expect($stored)->not->toBe($plain);
    expect($stored)->toBe(hash('sha256', $plain));
});

it('token tidak muncul di log aplikasi', function () {
    $logFile = storage_path('logs/laravel.log');
    if (! file_exists($logFile)) {
        $this->markTestSkipped('Log aplikasi tidak ditulis selama test.');
    }

    $user  = $this->createFreshUser();
    $plain = explode('|', tokenTheftLogin($this, $user), 2)[1];

    expect(file_get_contents($logFile))->not->toContain($plain);
});