<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Pastikan HANYA satu akun yang bisa berperan developer.
 *
 * Developer = akses lintas tenant, jadi peran ini sangat sensitif. Akun
 * berperan "developer" yang emailnya bukan developer sah (config
 * kasirai.developer_email) ditolak di semua route terproteksi. Dipasang pada
 * grup auth:sanctum, jadi pengecekan tunggal ini melindungi semua controller
 * yang memeriksa `role === 'developer'`.
 */
class EnsureSingleDeveloper
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isImpostorDeveloper()) {
            return response()->json([
                'message' => 'Akses ditolak. Peran developer hanya untuk akun developer resmi.',
            ], 403);
        }

        return $next($request);
    }
}
