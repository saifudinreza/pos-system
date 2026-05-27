<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    // =============================================================
    // INDEX — ambil semua user
    // Developer: lihat semua user lintas tenant
    // Admin: lihat user dalam tenant sendiri (via TenantScope di User model)
    // =============================================================
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name',  'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

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
    // =============================================================
    public function show(int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        return response()->json([
            'message' => 'Detail user berhasil diambil.',
            'data'    => $this->formatUser($user),
        ], 200);
    }

    // =============================================================
    // STORE — buat user baru
    // POST /api/users
    // Developer: bisa buat user tanpa tenant (system user) atau assign ke tenant tertentu
    // =============================================================
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'email', 'unique:users'],
            'password'              => ['required', 'confirmed', Password::min(8)],
            'role'                  => ['required', Rule::in(['admin', 'kasir', 'user', 'developer'])],
            'phone'                 => ['nullable', 'string', 'max:15'],
            'is_active'             => ['sometimes', 'boolean'],
            'tenant_id'             => ['nullable', 'exists:tenants,id'],
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json([
            'message' => 'User berhasil dibuat.',
            'data'    => $this->formatUser($user),
        ], 201);
    }

    // =============================================================
    // UPDATE — edit data user
    // =============================================================
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name'      => ['sometimes', 'string', 'max:255'],
            'email'     => ['sometimes', 'string', 'email', Rule::unique('users')->ignore($id)],
            'password'  => ['sometimes', 'confirmed', Password::min(8)],
            'role'      => ['sometimes', Rule::in(['admin', 'kasir', 'user', 'developer'])],
            'phone'     => ['nullable', 'string', 'max:15'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Data user berhasil diupdate.',
            'data'    => $this->formatUser($user->fresh()),
        ], 200);
    }

    // =============================================================
    // TOGGLE ACTIVE — aktifkan / nonaktifkan user
    // =============================================================
    public function toggleActive(int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        if (Auth::id() === $user->id) {
            return response()->json([
                'message' => 'Kamu tidak bisa menonaktifkan akun sendiri.',
            ], 422);
        }

        $user->update(['is_active' => ! $user->is_active]);
        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'message' => "User berhasil {$status}.",
            'data'    => $this->formatUser($user->fresh()),
        ], 200);
    }

    // =============================================================
    // HELPER
    // =============================================================
    private function formatUser(User $user): array
    {
        return [
            'id'          => $user->id,
            'tenant_id'   => $user->tenant_id,
            'tenant_name' => $user->tenant?->name,
            'name'        => $user->name,
            'email'       => $user->email,
            'role'        => $user->role,
            'phone'       => $user->phone,
            'is_active'   => $user->is_active,
            'created_at'  => $user->created_at->format('d M Y'),
        ];
    }
}
