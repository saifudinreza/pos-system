<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiInsight;
use App\Services\InsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsightController extends Controller
{
    // GET /api/insights — insight terakhir yang tersimpan
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

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

    // POST /api/insights/generate — buat ulang insight (dibatasi 5x/menit
    // karena memanggil LLM = biaya token)
    public function generate(Request $request): JsonResponse
    {
        $insights = app(InsightService::class)->generateForTenant($request->user()->tenant_id);

        return response()->json([
            'message'      => 'Wawasan AI berhasil diperbarui.',
            'data'         => collect($insights)->map(fn($i) => $this->format($i)),
            'generated_at' => now()->format('d M Y H:i'),
        ]);
    }

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
