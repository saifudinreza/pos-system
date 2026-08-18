<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware RoleMiddleware — membatasi akses route berdasarkan role user.
 *
 * Dipasang via alias 'role' (didaftarkan di bootstrap/app.php). Bisa menerima
 * satu atau lebih role, contoh: role:admin atau role:admin,kasir.
 * Urutan cek: belum login (401) → role tidak cocok (403) → akun nonaktif (403).
 */
class RoleMiddleware
{
    /**
     * Handle request: cek autentikasi, role, dan status aktif user.
     *
     * @param string ...$roles daftar role yang diizinkan (bisa lebih dari satu)
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // ↑ string ...$roles = bisa terima multiple role
        // Contoh pakai: middleware('role:admin')
        // Contoh pakai: middleware('role:admin,kasir')

        if (! $request->user()) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
            // ↑ Belum login sama sekali
        }

        if (! in_array($request->user()->role, $roles)) {
            return response()->json([
                'message' => 'Unauthorized. Akses ditolak.',
            ], 403);
            // ↑ Sudah login tapi role-nya tidak sesuai
            // Contoh: kasir coba akses endpoint admin
        }

        if (! $request->user()->is_active) {
            return response()->json([
                'message' => 'Akun  kamu dinonaktifkan. hubungi admin.'
            ], 403);
            // ↑ User sudah dinonaktifkan admin
        }

        return $next($request);
        // ↑ Lolos semua pengecekan, lanjut ke controller
    }
}