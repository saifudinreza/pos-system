<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

/**
 * AuthController, autentikasi & profil: register, login, logout, reset
 * password via kode OTP email, dan update profil (termasuk konfigurasi Midtrans
 * per-tenant untuk admin/developer).
 */
class AuthController extends Controller
{
    /** Masa berlaku OTP reset password (menit). */
    private const OTP_TTL_MINUTES = 10;

    /** Batas salah input OTP sebelum OTP dihanguskan. */
    private const OTP_MAX_ATTEMPTS = 5;

    // =============================================================
    // REGISTER, daftar akun baru (sekaligus buat tenant/toko)
    // POST /api/register
    // Body: { name, email, password, phone?, store_name? }
    // =============================================================
    /**
     * Daftar akun baru. Kalau nama toko sudah ada, user bergabung ke tenant
     * itu sebagai kasir; kalau belum ada, tenant baru dibuat dan user jadi
     * admin. Balas 201 + token Sanctum.
     *
     * @param Request $request Data registrasi ter-validasi
     * @return JsonResponse 201 { message, data: { user, token, is_new_store } }
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password'   => ['required', 'string', Password::min(8)],
            'phone'      => ['nullable', 'string', 'max:15'],
            'store_name' => ['nullable', 'string', 'max:255'],
        ]);

        $storeName = trim($validated['store_name'] ?? ('Toko ' . $validated['name']));

        // Ambil tenant yang punya paling banyak member (hindari tenant duplikat kosong)
        $existingTenant = Tenant::where('name', $storeName)
            ->withCount('users')
            ->orderByDesc('users_count')
            ->orderBy('id')
            ->first();

        if ($existingTenant) {
            // Bergabung ke tenant yang sudah ada sebagai kasir
            $tenant  = $existingTenant;
            $role    = 'kasir';
            $message = 'Berhasil bergabung dengan toko "' . $storeName . '"! Login sebagai kasir.';

            // Batasi: maksimal 2 kasir per tenant
            $kasirCount = User::where('tenant_id', $tenant->id)
                ->where('role', 'kasir')
                ->count();
            if ($kasirCount >= 2) {
                return response()->json([
                    'message' => 'Toko "' . $storeName . '" sudah mencapai batas maksimal kasir (2).',
                ], 422);
            }

            // Ambil plan dari admin tenant untuk disinkronkan ke user baru
            $adminPlan = User::where('tenant_id', $tenant->id)
                ->where('role', 'admin')
                ->value('subscription_plan') ?? 'free';
        } else {
            // Buat tenant baru, pendaftar pertama jadi admin toko
            $tenant  = Tenant::create([
                'name' => $storeName,
                'slug' => Str::slug($storeName . '-' . Str::random(6)),
            ]);
            $role    = 'admin';
            $message = 'Toko "' . $storeName . '" berhasil dibuat! Kamu terdaftar sebagai admin.';
            $adminPlan = 'free';
        }

        $user = User::create([
            'tenant_id'         => $tenant->id,
            'name'              => $validated['name'],
            'email'             => $validated['email'],
            'password'          => Hash::make($validated['password']),
            'phone'             => $validated['phone'] ?? null,
            'role'              => $role,
            'subscription_plan' => $adminPlan,
        ]);

        $token = $user->createToken('pos-token')->plainTextToken;

        return response()->json([
            'message' => $message,
            'data'    => [
                'user'       => $this->formatUser($user->load('tenant')),
                'token'      => $token,
                'is_new_store' => !$existingTenant,
            ],
        ], 201);
    }

    /**
     * Cek ketersediaan nama toko (dipakai form register untuk auto-suggest).
     * GET /api/check-tenant?name=xxx
     *
     * @param Request $request Query param `name` (min 2 karakter)
     * @return JsonResponse { exists, tenant: { name, member_count } | null }
     */
    public function checkTenant(Request $request): JsonResponse
    {
        $name = trim($request->query('name', ''));
        if (strlen($name) < 2) {
            return response()->json(['exists' => false, 'tenant' => null]);
        }

        // Ambil tenant yang punya paling banyak member supaya tidak ambil tenant duplikat kosong
        $tenant = Tenant::where('name', $name)
            ->withCount('users')
            ->orderByDesc('users_count')
            ->orderBy('id')
            ->first();

        return response()->json([
            'exists' => (bool) $tenant,
            'tenant' => $tenant ? [
                'name'         => $tenant->name,
                'member_count' => $tenant->users_count,
            ] : null,
        ]);
    }

    // =============================================================
    // LOGIN
    // POST /api/login
    // =============================================================
    /**
     * Login dengan email & password. Semua token lama dihapus (one device),
     * lalu token baru dibuat. Akun nonaktif ditolak dengan 403.
     *
     * @param Request $request Body: { email, password }
     * @return JsonResponse 200 { message, data: { user, token } } / 401 / 403
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Akun kamu dinonaktifkan. Hubungi admin.',
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('pos-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'data'    => [
                'user'  => $this->formatUser($user->load('tenant')),
                'token' => $token,
            ],
        ], 200);
    }

    // =============================================================
    // FORGOT PASSWORD, minta link reset lewat email
    // POST /api/forgot-password
    // Body: { email }
    // =============================================================
    /**
     * Kirim email berisi link reset password (token sekali pakai, 60 menit).
     * Balasan identik untuk email terdaftar/tdk → anti user-enumeration.
     *
     * @param Request $request Body: { email }
     * @return JsonResponse 200 { message }
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $user = User::where('email', $request->email)->first();

        // Selalu balas pesan yang sama (terdaftar atau tidak), anti user-enumeration:
        // orang jahat tidak boleh tahu apakah sebuah email terdaftar di sistem.
        $message = 'Kalau email kamu terdaftar, link reset password sudah dikirim. Cek kotak masuk (atau folder spam)!';

        // Jeda 60 detik per email: cegah banjir email ke korban. Diam-diam (respons tetap sama).
        if ($user && !Cache::has(self::otpCooldownKey($request->email))) {
            // OTP 6 digit acak (aman kriptografi), disimpan ter-hash, bukan teks asli
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            Cache::put(self::otpKey($request->email), [
                'hash'       => Hash::make($otp),
                'attempts'   => 0,
                'expires_at' => now()->addMinutes(self::OTP_TTL_MINUTES)->timestamp,
            ], now()->addMinutes(self::OTP_TTL_MINUTES));
            Cache::put(self::otpCooldownKey($request->email), true, now()->addSeconds(60));

            Mail::to($user)->send(new ResetPasswordMail($user, $otp, self::OTP_TTL_MINUTES));
        }

        return response()->json(['message' => $message], 200);
    }

    // =============================================================
    // RESET PASSWORD, ganti password pakai token dari email
    // POST /api/reset-password
    // Body: { email, token, password, password_confirmation }
    // =============================================================
    /**
     * Ganti password memakai token dari email. Token valid 60 menit & sekali
     * pakai; semua token Sanctum user dicabut (harus login ulang).
     *
     * @param Request $request Body: { email, token, password, password_confirmation }
     * @return JsonResponse 200 sukses / 422 token tidak valid
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'string', 'email', 'max:255'],
            'otp'      => ['required', 'digits:6'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)],
        ]);

        $key    = self::otpKey($request->email);
        $record = Cache::get($key);
        $user   = User::where('email', $request->email)->first();

        // Pesan sengaja generik: tidak membedakan OTP salah / kedaluwarsa / email tak dikenal
        $invalid = response()->json([
            'message' => 'Kode salah atau sudah kedaluwarsa. Periksa kodenya, atau minta kode baru.',
        ], 422);

        if (!$record || !$user) {
            return $invalid;
        }

        if (!Hash::check($request->otp, $record['hash'])) {
            $record['attempts']++;
            if ($record['attempts'] >= self::OTP_MAX_ATTEMPTS) {
                Cache::forget($key); // terlalu banyak salah → OTP hangus, harus minta baru
            } else {
                Cache::put($key, $record, Carbon::createFromTimestamp($record['expires_at']));
            }
            return $invalid;
        }

        $user->forceFill(['password' => Hash::make($request->password)])->save();
        // Cabut semua sesi login lama, user harus login ulang dengan password baru
        $user->tokens()->delete();
        Cache::forget($key); // sekali pakai

        return response()->json([
            'message' => 'Password berhasil diganti. Silakan login dengan password baru.',
        ], 200);
    }

    /** Key cache OTP reset password (satu OTP aktif per email). */
    private static function otpKey(string $email): string
    {
        return 'pwd_otp:' . Str::lower($email);
    }

    /** Key cache jeda kirim ulang OTP. */
    private static function otpCooldownKey(string $email): string
    {
        return 'pwd_otp_cd:' . Str::lower($email);
    }

    // =============================================================
    // LOGOUT
    // POST /api/logout
    // =============================================================
    /**
     * Logout: hapus token Sanctum yang sedang dipakai.
     *
     * @param Request $request Request ber-autentikasi
     * @return JsonResponse 200 { message }
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ], 200);
    }

    // =============================================================
    // ME, ambil data user yang sedang login
    // GET /api/me
    // =============================================================
    /**
     * Data user yang sedang login (dengan info tenant & plan efektif).
     *
     * @param Request $request Request ber-autentikasi
     * @return JsonResponse 200 { data: formatUser(user) }
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->formatUser($request->user()->load('tenant')),
        ], 200);
    }

    // =============================================================
    // UPDATE PROFILE
    // PUT /api/profile
    // =============================================================
    /**
     * Update profil user. Field user (name/phone) berlaku untuk semua role;
     * info toko + key Midtrans hanya untuk admin/developer, kasir yang
     * mengirim field tersebut diabaikan (silent).
     *
     * @param Request $request Body: name?, phone?, store_name?, store_description?,
     *                          midtrans_server_key?, midtrans_client_key?, midtrans_is_production?
     * @return JsonResponse 200 { message, data: formatUser(user) }
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                 => ['sometimes', 'string', 'max:255'],
            'phone'                => ['nullable', 'string', 'max:20'],
            'store_name'           => ['sometimes', 'string', 'max:255'],
            'store_description'    => ['nullable', 'string', 'max:500'],
            'midtrans_server_key'  => ['nullable', 'string', 'max:500'],
            'midtrans_client_key'  => ['nullable', 'string', 'max:255'],
            'midtrans_is_production' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();

        $userFields = array_intersect_key($validated, array_flip(['name', 'phone']));
        if (!empty($userFields)) {
            $user->update($userFields);
        }

        // Only admin/developer can update their store info + Midtrans keys
        if ($user->tenant && in_array($user->role, ['admin', 'developer'])) {
            $tenantData = [];
            if (isset($validated['store_name']))           $tenantData['name']                = $validated['store_name'];
            if (array_key_exists('store_description', $validated)) $tenantData['description'] = $validated['store_description'];
            if (array_key_exists('midtrans_server_key', $validated)) $tenantData['midtrans_server_key'] = $validated['midtrans_server_key'];
            if (array_key_exists('midtrans_client_key', $validated)) $tenantData['midtrans_client_key'] = $validated['midtrans_client_key'];
            if (array_key_exists('midtrans_is_production', $validated)) $tenantData['midtrans_is_production'] = $validated['midtrans_is_production'];
            if (!empty($tenantData)) $user->tenant->update($tenantData);
        }

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'data'    => $this->formatUser($user->load('tenant')),
        ]);
    }

    // =============================================================
    // HELPER
    // =============================================================
    /**
     * Format data user untuk response (whitelist field, tanpa data sensitif
     * seperti password/hash). Key Midtrans server TIDAK pernah dikirim,
     * hanya flag `midtrans_configured`.
     *
     * @param User $user User yang akan diformat
     * @return array Data user siap-JSON
     */
    private function formatUser(User $user): array
    {
        return [
            'id'                    => $user->id,
            'tenant_id'             => $user->tenant_id,
            'tenant_name'           => $user->tenant?->name,
            'tenant_description'    => $user->tenant?->description,
            'midtrans_client_key'   => $user->tenant?->midtrans_client_key,
            'midtrans_is_production' => $user->tenant?->midtrans_is_production,
            'midtrans_configured'   => !empty($user->tenant?->midtrans_server_key) && !empty($user->tenant?->midtrans_client_key),
            'name'                  => $user->name,
            'email'                 => $user->email,
            'role'                  => $user->role,
            'phone'                 => $user->phone,
            'is_active'             => $user->is_active,
            'subscription_plan'     => $user->subscription_plan ?? 'free',
            // Plan efektif, kasir mengikuti plan admin tenant-nya
            'effective_plan'        => $this->getEffectivePlan($user),
            'created_at'            => $user->created_at->format('d M Y'),
        ];
    }
}
