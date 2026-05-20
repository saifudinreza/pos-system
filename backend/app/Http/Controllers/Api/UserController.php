<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    // =============================================================
    // INDEX — ambil semua user (admin only)
    // GET /api/users
    // GET /api/users?role=kasir&search=budi
    // =============================================================
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // ----- SEARCH -----
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
                // ↑ Cari by nama ATAU email
                // Dibungkus closure supaya tidak conflict dengan filter lain
            });
        }

        // ----- FILTER ROLE -----
        if ($request->filled('role')) {
            $query->where('role', $request->role);
            // ↑ Filter: ?role=admin, ?role=kasir, ?role=user
        }

        // ----- FILTER STATUS -----
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min($request->get('per_page', 10), 100);
        $users   = $query->latest()->paginate($perPage);

        return response()->json([
            'message' => 'Data user berhasil diambil.',
            'data'    => $users->map(fn($u) => $this->formatUser($u)),
            'meta'    => [
                'current_page' => $users->currentPage(),
                'per_page'     => $users->perPage(),
                'total'        => $users->total(),
                'last_page'    => $users->lastPage(),
            ],
        ], 200);
    }

    // =============================================================
    // SHOW — detail satu user
    // GET /api/users/{id}
    // =============================================================
    public function show(int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Detail user berhasil diambil.',
            'data'    => $this->formatUser($user),
        ], 200);
    }

    // =============================================================
    // UPDATE — edit data user
    // PUT /api/users/{id}
    // Admin bisa update semua field termasuk role
    // =============================================================
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'string', 'email', 'unique:users,email,' . $id],
            // ↑ unique tapi ignore user ini sendiri supaya bisa save tanpa ganti email
            'password' => ['sometimes', 'confirmed', Password::min(8)],
            // ↑ 'sometimes' = hanya divalidasi kalau dikirim
            // Jadi admin bisa update nama tanpa harus kirim password baru
            'role'     => ['sometimes', 'in:admin,kasir,user'],
            'phone'    => ['nullable', 'string', 'max:15'],
            'is_active'=> ['sometimes', 'boolean'],
        ]);

        // Hash password kalau dikirim
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
            // ↑ Manual hash karena update() tidak trigger cast 'hashed' di model
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Data user berhasil diupdate.',
            'data'    => $this->formatUser($user->fresh()),
        ], 200);
    }

    // =============================================================
    // TOGGLE ACTIVE — aktifkan / nonaktifkan user
    // PATCH /api/users/{id}/toggle
    // =============================================================
    public function toggleActive(int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        // Cegah admin nonaktifkan dirinya sendiri
        if (auth()->id() === $user->id) {
            return response()->json([
                'message' => 'Kamu tidak bisa menonaktifkan akun sendiri.',
            ], 422);
        }

        $user->update(['is_active' => ! $user->is_active]);
        // ↑ Toggle: kalau true jadi false, kalau false jadi true

        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'message'   => "User berhasil {$status}.",
            'data'      => $this->formatUser($user->fresh()),
        ], 200);
    }

    // =============================================================
    // HELPER — format data user untuk response
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
        ];
        // ↑ Password tidak ikut karena sudah di-hidden di Model
    }
}