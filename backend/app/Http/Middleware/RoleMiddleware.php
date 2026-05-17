<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
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
