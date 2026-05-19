<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // =============================================================
    // REGISTER
    // POST /api/register
    // =============================================================
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', Password::min(8)],
            // ↑ 'confirmed' = wajib ada field password_confirmation yang nilainya sama
            // Password::min(8) = minimal 8 karakter
            'phone' => ['nullable', 'string', 'max:15'],
        ]);
        // ↑ Kalau validasi gagal, Laravel otomatis return 422 dengan pesan error
        // Tidak perlu try-catch untuk validasi

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user',
            // ↑ Register publik hanya bisa jadi role 'user'
            // Admin dan kasir dibuat manual oleh admin via UserController
        ]);

        $token = $user->createToken('pos-token')->plainTextToken;
        // ↑ Buat Sanctum token untuk user yang baru register
        // plainTextToken = string token yang dikirim ke frontend
        // Frontend simpan token ini di localStorage / cookie

        return response()->json([
            'message' => 'Register berhasil',
            'data' => [
                'user' => $this->formatUser($user),
                'token' => $token,
            ],
        ], 201);
        // ↑ 201 = Created, standar HTTP untuk resource baru berhasil dibuat
    }

    // =============================================================
    // LOGIN
    // POST /api/login
    // =============================================================
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();
        // ↑ Cari user berdasarkan email dulu
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
            // ↑ 401 = Unauthorized
            // Sengaja pesan error digabung (tidak spesifik email atau password)
            // Supaya tidak bisa ditebak mana yang salah (security best practice)
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Akun kamu dinonaktifkan. hubungi admin.',
            ], 403);
            // ↑ 403 = Forbidden
            // User ada tapi tidak boleh login
        }

        // Hapus token lama supaya tidak numpuk di database
        $user->tokens()->delete();
        // ↑ Setiap login baru, token lama dihapus
        // Jadi satu user hanya punya satu token aktif
        // Berguna untuk keamanan: logout dari device lain otomatis

        $token = $user->createToken('pos-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'data'    => [
                'user'  => $this->formatUser($user),
                'token' => $token,
            ],
        ], 200);
    }

     // =============================================================
    // LOGOUT
    // POST /api/logout
    // Header: Authorization: Bearer {token}
    // =============================================================
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        // ↑ Hapus HANYA token yang sedang dipakai sekarang
        // Bukan semua token user (berbeda dengan tokens()->delete())
        // Berguna kalau user login di multiple device

        return response()->json([
            'message' => 'Logout berhasil.',
        ], 200);
    }

    // =============================================================
    // ME — ambil data user yang sedang login
    // GET /api/me
    // Header: Authorization: Bearer {token}
    // =============================================================
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->formatUser($request->user()),
            // ↑ $request->user() = ambil user dari token yang dikirim
            // Sanctum otomatis resolve user dari Bearer token di header
        ], 200);
    }

    // =============================================================
    // HELPER — format data user untuk response
    // Private karena hanya dipakai di controller ini
    // =============================================================
    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'phone'      => $user->phone,
            'is_active'  => $user->is_active,
            'created_at' => $user->created_at->format('d M Y'),
            // ↑ Format tanggal ke "17 May 2025" lebih readable dari ISO format
        ];
        // ↑ Password tidak ikut di sini karena sudah di-hidden di Model
        // Selalu gunakan helper ini supaya response konsisten di semua method
    }
}
