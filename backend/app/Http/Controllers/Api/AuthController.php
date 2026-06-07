<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // =============================================================
    // REGISTER — daftar akun baru (sekaligus buat tenant/toko)
    // POST /api/register
    // Body: { name, email, password, phone?, store_name? }
    // =============================================================
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password'   => ['required', 'string', Password::min(8)],
            'phone'      => ['nullable', 'string', 'max:15'],
            'store_name' => ['nullable', 'string', 'max:255'],
        ]);

        $storeName      = trim($validated['store_name'] ?? ('Toko ' . $validated['name']));
        $existingTenant = Tenant::where('name', $storeName)->first();

        if ($existingTenant) {
            // Bergabung ke tenant yang sudah ada sebagai kasir
            $tenant  = $existingTenant;
            $role    = 'kasir';
            $message = 'Berhasil bergabung dengan toko "' . $storeName . '"! Login sebagai kasir.';
        } else {
            // Buat tenant baru, pendaftar pertama jadi admin toko
            $tenant  = Tenant::create([
                'name' => $storeName,
                'slug' => Str::slug($storeName . '-' . Str::random(6)),
            ]);
            $role    = 'admin';
            $message = 'Toko "' . $storeName . '" berhasil dibuat! Kamu terdaftar sebagai admin.';
        }

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'phone'     => $validated['phone'] ?? null,
            'role'      => $role,
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

    // GET /api/check-tenant?name=xxx — cek apakah nama toko sudah terdaftar
    public function checkTenant(Request $request): JsonResponse
    {
        $name = trim($request->query('name', ''));
        if (strlen($name) < 2) {
            return response()->json(['exists' => false, 'tenant' => null]);
        }

        $tenant = Tenant::where('name', $name)->first();
        return response()->json([
            'exists' => (bool) $tenant,
            'tenant' => $tenant ? [
                'name'        => $tenant->name,
                'member_count' => $tenant->users()->count(),
            ] : null,
        ]);
    }

    // =============================================================
    // LOGIN
    // POST /api/login
    // =============================================================
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
    // LOGOUT
    // POST /api/logout
    // =============================================================
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ], 200);
    }

    // =============================================================
    // ME — ambil data user yang sedang login
    // GET /api/me
    // =============================================================
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
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'              => ['sometimes', 'string', 'max:255'],
            'phone'             => ['nullable', 'string', 'max:20'],
            'store_name'        => ['sometimes', 'string', 'max:255'],
            'store_description' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();

        $userFields = array_intersect_key($validated, array_flip(['name', 'phone']));
        if (!empty($userFields)) {
            $user->update($userFields);
        }

        // Only admin/developer can update their store info
        if ($user->tenant && in_array($user->role, ['admin', 'developer'])) {
            $tenantData = [];
            if (isset($validated['store_name']))        $tenantData['name']        = $validated['store_name'];
            if (array_key_exists('store_description', $validated)) $tenantData['description'] = $validated['store_description'];
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
    private function formatUser(User $user): array
    {
        return [
            'id'                  => $user->id,
            'tenant_id'           => $user->tenant_id,
            'tenant_name'         => $user->tenant?->name,
            'tenant_description'  => $user->tenant?->description,
            'name'                => $user->name,
            'email'               => $user->email,
            'role'                => $user->role,
            'phone'               => $user->phone,
            'is_active'           => $user->is_active,
            'subscription_plan'   => $user->subscription_plan ?? 'free',
            'created_at'          => $user->created_at->format('d M Y'),
        ];
    }
}
