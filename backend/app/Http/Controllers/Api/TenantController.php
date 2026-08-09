<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    // GET /api/dev/tenants
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::withCount('users')
            ->with(['users' => fn($q) => $q->select('id', 'tenant_id', 'name', 'email', 'role', 'is_active')]);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $tenants = $query->orderByDesc('created_at')->get();

        return response()->json([
            'message' => 'Data tenant berhasil diambil.',
            'data'    => $tenants->map(fn($t) => $this->formatTenant($t)),
        ]);
    }

    // GET /api/dev/tenants/{id}
    public function show(int $id): JsonResponse
    {
        $tenant = Tenant::withCount('users')
            ->with(['users' => fn($q) => $q->select('id', 'tenant_id', 'name', 'email', 'role', 'is_active')])
            ->find($id);

        if (! $tenant) return response()->json(['message' => 'Tenant tidak ditemukan.'], 404);

        return response()->json([
            'message' => 'Detail tenant berhasil diambil.',
            'data'    => $this->formatTenant($tenant),
        ]);
    }

    // PUT /api/dev/tenants/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $tenant = Tenant::find($id);
        if (! $tenant) return response()->json(['message' => 'Tenant tidak ditemukan.'], 404);

        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        $tenant->update($validated);

        \App\Services\AuditLogService::log('updated', 'tenant', $tenant->id, null, $validated);

        return response()->json([
            'message' => 'Tenant berhasil diupdate.',
            'data'    => $this->formatTenant($tenant->fresh()->loadCount('users')->load('users')),
        ]);
    }

    // DELETE /api/dev/tenants/{id}
    public function destroy(int $id): JsonResponse
    {
        $tenant = Tenant::find($id);
        if (! $tenant) return response()->json(['message' => 'Tenant tidak ditemukan.'], 404);

        $name = $tenant->name;

        // ⚠️ JANGAN set tenant_id = null pada user — user dengan tenant_id null
        // dianggap developer (TenantScope melewati filter) → bisa melihat data
        // SEMUA tenant. Yang benar:
        // 1. Cabut semua token Sanctum user tenant (langsung logout di semua perangkat)
        // 2. Nonaktifkan akunnya (is_active = false → tidak bisa login lagi)
        //    (FK nullOnDelete otomatis akan me-null-kan tenant_id di DB, tapi
        //    dengan token dicabut + akun nonaktif, user tidak bisa akses apa pun)
        $users = User::where('tenant_id', $id)->get();
        foreach ($users as $user) {
            $user->tokens()->delete();
            $user->update(['is_active' => false]);
        }

        $tenant->delete();

        \App\Services\AuditLogService::log('deleted', 'tenant', $tenant->id, [
            'name' => $tenant->name, 'slug' => $tenant->slug,
        ], null);

        return response()->json(['message' => "Tenant \"{$name}\" berhasil dihapus."]);
    }

    private function formatTenant(Tenant $tenant): array
    {
        return [
            'id'          => $tenant->id,
            'name'        => $tenant->name,
            'slug'        => $tenant->slug,
            'description' => $tenant->description,
            'is_active'   => $tenant->is_active,
            'users_count' => $tenant->users_count ?? 0,
            'created_at'  => $tenant->created_at->format('d M Y'),
            'users'       => $tenant->users?->map(fn($u) => [
                'id'        => $u->id,
                'name'      => $u->name,
                'email'     => $u->email,
                'role'      => $u->role,
                'is_active' => $u->is_active,
            ])->values()->toArray() ?? [],
        ];
    }
}
