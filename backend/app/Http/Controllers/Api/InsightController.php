<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiInsight;
use App\Services\InsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * InsightController — Wawasan AI (AI Business Insight) yang tersimpan.
 *
 * Insight dibuat/di-update oleh InsightService (LLM Groq dengan fallback
 * templated kalau LLM error). Berbeda dari AI chat: generate di sini masih
 * sinkron (dibatasi throttle 5/menit karena memanggil LLM = biaya token).
 * Role: admin & developer saja.
 */
class InsightController extends Controller
{
    /**
     * Insight terakhir yang tersimpan (maks 10, terbaru dulu).
     * GET /api/insights
     *
     * @param Request $request Request ber-autentikasi
     * @return JsonResponse { message, data, generated_at }
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        // ↑ TenantScope juga aktif di model — where tenant_id di sini redundant
        // tapi harmless; untuk developer (tenant_id null) hasilnya kosong.

        $insights = AiInsight::where('tenant_id', $tenantId)
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'message'      => 'Data insight berhasil diambil.',
            'data'         => $insights->map(fn($i) => $this->format($i)),
            'generated_at' => $insights->first()?->created_at?->format('d M Y H:i'),
        ]);
    }

    /**
     * Buat ulang insight untuk tenant (panggil InsightService → LLM Groq,
     * fallback templated). Dibatasi 5x/menit via throttle route karena
     * memanggil LLM = biaya token.
     * POST /api/insights/generate
     *
     * @param Request $request Request ber-autentikasi
     * @return JsonResponse { message, data, generated_at }
     */
    public function generate(Request $request): JsonResponse
    {
        $insights = app(InsightService::class)->generateForTenant($request->user()->tenant_id);

        return response()->json([
            'message'      => 'Wawasan AI berhasil diperbarui.',
            'data'         => collect($insights)->map(fn($i) => $this->format($i)),
            'generated_at' => now()->format('d M Y H:i'),
        ]);
    }

    /**
     * Format satu insight untuk response (whitelist field + periode).
     *
     * @param AiInsight $insight Insight yang akan diformat
     * @return array Data insight siap-JSON
     */
    private function format(AiInsight $insight): array
    {
        return [
            'id'           => $insight->id,
            'type'         => $insight->type,
            'title'        => $insight->title,
            'body'         => $insight->body,
            'period_start' => $insight->period_start?->toDateString(),
            'period_end'   => $insight->period_end?->toDateString(),
            'created_at'   => $insight->created_at?->format('d M Y H:i'),
        ];
    }
}
