<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CorsMiddleware, Middleware CORS custom
 *
 * Menambahkan header Access-Control-Allow-Origin ke SEMUA respons,
 * dan langsung membalas request OPTIONS (preflight) dengan 204 No Content.
 *
 * Ini solusi paling direct untuk masalah CORS cross-origin dari Vercel ke Render.
 */
class CorsMiddleware
{
    /**
     * Header CORS yang selalu dikirim ke client browser.
     */
    private array $headers = [
        'Access-Control-Allow-Origin'  => '*',
        'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-XSRF-TOKEN',
        'Access-Control-Max-Age'       => '86400',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Preflight OPTIONS request, browser mengirim ini sebelum request asli
        // Langsung balas 204 tanpa diteruskan ke Laravel router
        if ($request->isMethod('OPTIONS')) {
            return response('', 204, $this->headers);
        }

        // Request biasa, teruskan ke controller, lalu tambahkan header CORS ke response
        $response = $next($request);

        foreach ($this->headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }
}
