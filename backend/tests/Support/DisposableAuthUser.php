<?php

namespace Tests\Support;

use App\Mail\ResetPasswordMail;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;

trait DisposableAuthUser
{
    /** @var int[] */
    protected array $createdUserIds = [];

    /** @var int[] */
    protected array $createdTenantIds = [];

    public function validPassword(): string
    {
        return 'Rahasia123!';
    }

    public function newPassword(): string
    {
        return 'PasswordBaru456!';
    }

    public function wrongPassword(): string
    {
        return 'SalahTotal999!';
    }

    public function uniqueEmail(): string
    {
        return 'auth-test-' . Str::uuid() . '@kasirai.test';
    }

    public function unregisteredEmail(): string
    {
        return 'tidak-ada-' . Str::uuid() . '@kasirai.test';
    }

    public function assertSafeTestDatabase(): void
    {
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
    }

    public function withoutThrottle(): static
    {
        return $this->withoutMiddleware(ThrottleRequests::class);
    }

    public function createFreshUser(array $overrides = []): User
    {
        $name   = 'Toko Test ' . Str::random(8);
        $tenant = Tenant::create(['name' => $name, 'slug' => Str::slug($name) . '-' . Str::random(4)]);

        $user = User::factory()->create(array_merge([
            'tenant_id' => $tenant->id,
            'email'     => $this->uniqueEmail(),
            'password'  => Hash::make($this->validPassword()),
            'role'      => 'admin',
            'is_active' => true,
        ], $overrides));

        $this->createdTenantIds[] = $tenant->id;
        $this->createdUserIds[]   = $user->id;

        return $user;
    }

    public function registerFreshUserViaApi(array $overrides = []): TestResponse
    {
        $payload = array_merge([
            'name'       => 'User Test',
            'email'      => $this->uniqueEmail(),
            'password'   => $this->validPassword(),
            'store_name' => 'Toko Test ' . Str::random(8),
        ], $overrides);

        $response = $this->postJson('/api/register', $payload);

        if ($response->getStatusCode() === 201 && is_string($payload['email'] ?? null)) {
            $this->trackUserByEmail($payload['email']);
        }

        return $response;
    }

    /** Catat user (dan tenant-nya) yang dibuat lewat API supaya ikut dibersihkan. */
    public function trackUserByEmail(string $email): void
    {
        $user = User::withoutGlobalScopes()->where('email', $email)->first();
        if ($user) {
            $this->createdUserIds[] = $user->id;
            if ($user->tenant_id) {
                $this->createdTenantIds[] = $user->tenant_id;
            }
        }
    }

    public function cleanupCreatedUsers(): void
    {
        Auth::forgetGuards();

        $userIds   = array_values(array_unique($this->createdUserIds));
        $tenantIds = array_values(array_unique($this->createdTenantIds));

        foreach (User::withoutGlobalScopes()->whereIn('id', $userIds)->get() as $user) {
            $user->tokens()->delete();
        }

        foreach (['products', 'categories'] as $table) {
            if ($tenantIds && Schema::hasTable($table)) {
                DB::table($table)->whereIn('tenant_id', $tenantIds)->delete();
            }
        }

        User::withoutGlobalScopes()->whereIn('id', $userIds)->delete();
        Tenant::withoutGlobalScopes()->whereIn('id', $tenantIds)->delete();

        foreach ($userIds as $id) {
            $this->assertDatabaseMissing('users', ['id' => $id]);
            $this->assertDatabaseMissing('personal_access_tokens', [
                'tokenable_id'   => $id,
                'tokenable_type' => User::class,
            ]);
        }
        foreach ($tenantIds as $id) {
            $this->assertDatabaseMissing('tenants', ['id' => $id]);
        }

        $this->createdUserIds   = [];
        $this->createdTenantIds = [];
    }

    /** GET/POST/dll dengan Bearer token khusus request ini (tidak menumpuk di header default). */
    public function requestWithToken(string $method, string $uri, ?string $token, array $data = [], array $headers = []): TestResponse
    {
        Auth::forgetGuards();

        if ($token !== null) {
            $headers['Authorization'] = 'Bearer ' . $token;
        }

        return $this->json($method, $uri, $data, $headers);
    }

    public function loginAs(string $email, string $password): TestResponse
    {
        return $this->postJson('/api/login', ['email' => $email, 'password' => $password]);
    }

    /** Minta OTP lewat endpoint, ambil kodenya dari email yang di-queue. */
    public function requestOtpFor(string $email): string
    {
        Mail::fake();
        $this->postJson('/api/forgot-password', ['email' => $email])->assertOk();

        $otp = null;
        Mail::assertQueued(ResetPasswordMail::class, function ($mail) use (&$otp) {
            $otp = $mail->otp;
            return true;
        });

        return $otp;
    }

    /** Catat perilaku aktual ke storage/logs/auth-test-observations.log (di-gitignore lewat *.log). */
    public function observe(string $id, mixed $value): void
    {
        $text = is_string($value) ? $value : json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        @file_put_contents(
            storage_path('logs/auth-test-observations.log'),
            date('c') . " [{$id}] {$text}\n",
            FILE_APPEND
        );
    }
}
