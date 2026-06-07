<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiChatUsage;
use App\Models\AiQueryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Transaction;
use App\Services\GroqService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    public function __construct(private GroqService $groq) {}

    private function dailyLimit(): int
    {
        return config('ai.daily_limit', 10);
    }

    private function warningThresholdPct(): int
    {
        return config('ai.warning_threshold_pct', 30);
    }

    // =============================================================
    // USAGE TODAY — sisa kuota chat hari ini
    // GET /api/ai/usage-today
    // =============================================================
    public function usageToday(): JsonResponse
    {
        $limit = $this->dailyLimit();
        $usage = AiChatUsage::where('user_id', auth()->user()->id)
            ->where('usage_date', today())
            ->first();

        $used      = $usage?->count ?? 0;
        $remaining = max(0, $limit - $used);

        $warningAt  = (int) ceil($limit * $this->warningThresholdPct() / 100);
        $isWarning  = $remaining > 0 && $remaining <= $warningAt;

        return response()->json([
            'used'      => $used,
            'remaining' => $remaining,
            'limit'     => $limit,
            'warning'   => $isWarning,
        ]);
    }

    // =============================================================
    // QUERY — analisis penjualan natural language
    // POST /api/ai/query
    // =============================================================
    public function query(Request $request): JsonResponse
    {
        if (! $this->checkAndIncrementUsage()) {
            return $this->limitReachedResponse();
        }

        $validated = $request->validate([
            'query' => ['required', 'string', 'max:500'],
        ]);

        $topProducts = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', 'paid')
            ->whereMonth('orders.created_at', now()->month)
            ->selectRaw('
                products.name,
                products.sku,
                SUM(order_items.quantity) as total_terjual,
                SUM(order_items.subtotal) as total_pendapatan
            ')
            ->groupBy('products.name', 'products.sku')
            ->orderByDesc('total_terjual')
            ->limit(10)
            ->get();

        $totalRevenue = Transaction::where('status', 'settlement')
            ->whereMonth('paid_at', now()->month)
            ->sum('amount');

        $totalOrders = Order::where('status', 'paid')
            ->whereMonth('created_at', now()->month)
            ->count();

        $salesData = [
            'bulan'           => now()->format('F Y'),
            'total_revenue'   => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
            'total_orders'    => $totalOrders,
            'produk_terlaris' => $topProducts->toArray(),
        ];

        $systemPrompt = $this->groq->buildSalesPrompt($salesData);

        try {
            $result = $this->groq->ask($systemPrompt, $validated['query']);
        } catch (\Exception $e) {
            Log::error('AI query error', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'AI sedang tidak tersedia. Coba beberapa saat lagi.'], 503);
        }

        AiQueryLog::create([
            'user_id'     => $request->user()->id,
            'type'        => 'sales_analysis',
            'query'       => $validated['query'],
            'response'    => $result['text'],
            'tokens_used' => $result['tokens_used'],
            'provider'    => $result['provider'],
        ]);

        $usageAfter = $this->currentUsage();
        $limit      = $this->dailyLimit();
        $remaining  = max(0, $limit - $usageAfter);
        $warningAt  = (int) ceil($limit * $this->warningThresholdPct() / 100);

        return response()->json([
            'message' => 'AI berhasil menganalisis data penjualan.',
            'data'    => [
                'query'       => $validated['query'],
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'],
                'provider'    => $result['provider'],
                'model'       => $result['model'],
            ],
            'usage' => [
                'used'      => $usageAfter,
                'remaining' => $remaining,
                'limit'     => $limit,
                'warning'   => $remaining > 0 && $remaining <= $warningAt,
            ],
        ], 200);
    }

    // =============================================================
    // PREDICT STOCK
    // POST /api/ai/predict-stock
    // =============================================================
    public function predictStock(Request $request): JsonResponse
    {
        if (! $this->checkAndIncrementUsage()) {
            return $this->limitReachedResponse();
        }

        $validated = $request->validate([
            'query' => ['required', 'string', 'max:500'],
        ]);

        $products = Product::with('category')
            ->withCount([
                'orderItems as total_sold_30_days' => function ($q) {
                    $q->join('orders', 'order_items.order_id', '=', 'orders.id')
                      ->where('orders.status', 'paid')
                      ->where('orders.created_at', '>=', now()->subDays(30));
                }
            ])
            ->get()
            ->map(fn($p) => [
                'nama'              => $p->name,
                'stok_sekarang'     => $p->stock,
                'batas_alert'       => $p->stock_alert,
                'terjual_30_hari'   => $p->total_sold_30_days ?? 0,
                'rata_per_hari'     => round(($p->total_sold_30_days ?? 0) / 30, 2),
                'estimasi_habis'    => ($p->total_sold_30_days ?? 0) > 0
                    ? round($p->stock / (($p->total_sold_30_days ?? 1) / 30)) . ' hari lagi'
                    : 'Tidak ada data penjualan',
                'status'            => $p->stock <= $p->stock_alert ? 'MENIPIS' : 'Normal',
            ]);

        $stockData = [
            'tanggal_analisis' => now()->format('d M Y'),
            'data_produk'      => $products->toArray(),
        ];

        $systemPrompt = $this->groq->buildStockPrompt($stockData);

        try {
            $result = $this->groq->ask($systemPrompt, $validated['query']);
        } catch (\Exception $e) {
            Log::error('AI predict-stock error', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'AI sedang tidak tersedia. Coba beberapa saat lagi.'], 503);
        }

        AiQueryLog::create([
            'user_id'     => $request->user()->id,
            'type'        => 'stock_prediction',
            'query'       => $validated['query'],
            'response'    => $result['text'],
            'tokens_used' => $result['tokens_used'],
            'provider'    => $result['provider'],
        ]);

        $usageAfter = $this->currentUsage();
        $limit      = $this->dailyLimit();
        $remaining  = max(0, $limit - $usageAfter);
        $warningAt  = (int) ceil($limit * $this->warningThresholdPct() / 100);

        return response()->json([
            'message' => 'AI berhasil memprediksi stok.',
            'data'    => [
                'query'       => $validated['query'],
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'],
                'provider'    => $result['provider'],
                'model'       => $result['model'],
            ],
            'usage' => [
                'used'      => $usageAfter,
                'remaining' => $remaining,
                'limit'     => $limit,
                'warning'   => $remaining > 0 && $remaining <= $warningAt,
            ],
        ], 200);
    }

    // =============================================================
    // RECOMMEND
    // POST /api/ai/recommend
    // =============================================================
    public function recommend(Request $request): JsonResponse
    {
        if (! $this->checkAndIncrementUsage()) {
            return $this->limitReachedResponse();
        }

        $validated = $request->validate([
            'query'      => ['required', 'string', 'max:500'],
            'product_id' => ['nullable', 'exists:products,id'],
        ]);

        $patterns = DB::table('order_items as a')
            ->join('order_items as b', function ($join) {
                $join->on('a.order_id', '=', 'b.order_id')
                     ->whereColumn('a.product_id', '!=', 'b.product_id');
            })
            ->join('products as pa', 'a.product_id', '=', 'pa.id')
            ->join('products as pb', 'b.product_id', '=', 'pb.id')
            ->join('orders', 'a.order_id', '=', 'orders.id')
            ->where('orders.status', 'paid')
            ->when($request->filled('product_id'), function ($q) use ($request) {
                $q->where('a.product_id', $request->product_id);
            })
            ->selectRaw('
                pa.name as produk_a,
                pb.name as produk_b,
                COUNT(*) as frekuensi
            ')
            ->groupBy('pa.name', 'pb.name')
            ->orderByDesc('frekuensi')
            ->limit(15)
            ->get();

        $transactionData = [
            'tanggal_analisis' => now()->format('d M Y'),
            'pola_pembelian'   => $patterns->toArray(),
            'keterangan'       => 'frekuensi = berapa kali kedua produk dibeli dalam order yang sama',
        ];

        $systemPrompt = $this->groq->buildRecommendationPrompt($transactionData);

        try {
            $result = $this->groq->ask($systemPrompt, $validated['query']);
        } catch (\Exception $e) {
            Log::error('AI recommend error', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'AI sedang tidak tersedia. Coba beberapa saat lagi.'], 503);
        }

        AiQueryLog::create([
            'user_id'     => $request->user()->id,
            'type'        => 'recommendation',
            'query'       => $validated['query'],
            'response'    => $result['text'],
            'tokens_used' => $result['tokens_used'],
            'provider'    => $result['provider'],
        ]);

        $usageAfter = $this->currentUsage();
        $limit      = $this->dailyLimit();
        $remaining  = max(0, $limit - $usageAfter);
        $warningAt  = (int) ceil($limit * $this->warningThresholdPct() / 100);

        return response()->json([
            'message' => 'AI berhasil memberikan rekomendasi.',
            'data'    => [
                'query'       => $validated['query'],
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'],
                'provider'    => $result['provider'],
                'model'       => $result['model'],
            ],
            'usage' => [
                'used'      => $usageAfter,
                'remaining' => $remaining,
                'limit'     => $limit,
                'warning'   => $remaining > 0 && $remaining <= $warningAt,
            ],
        ], 200);
    }

    // =============================================================
    // LOGS — riwayat query AI
    // GET /api/ai/logs
    // =============================================================
    public function logs(): JsonResponse
    {
        $logs = AiQueryLog::with('user')
            ->latest()
            ->paginate(20);

        return response()->json([
            'message' => 'Log AI berhasil diambil.',
            'data'    => $logs->map(fn($log) => [
                'id'          => $log->id,
                'type'        => $log->type,
                'query'       => $log->query,
                'response'    => $log->response,
                'tokens_used' => $log->tokens_used,
                'provider'    => $log->provider,
                'user'        => $log->user->name,
                'created_at'  => $log->created_at->format('d M Y H:i'),
            ]),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'total'        => $logs->total(),
                'last_page'    => $logs->lastPage(),
            ],
        ], 200);
    }

    // =============================================================
    // STATS — ringkasan monitoring untuk admin
    // GET /api/ai/stats
    // =============================================================
    public function stats(): JsonResponse
    {
        $today      = today();
        $weekStart  = now()->startOfWeek();
        $monthStart = now()->startOfMonth();
        $limit      = $this->dailyLimit();
        $tokenAlert = config('ai.token_alert_threshold', 50000);

        $todayTokens = AiQueryLog::whereDate('created_at', $today)->sum('tokens_used');

        $summary = [
            'today' => [
                'requests'         => AiQueryLog::whereDate('created_at', $today)->count(),
                'tokens'           => $todayTokens,
                'active_users'     => AiChatUsage::where('usage_date', $today)->count(),
                'high_token_usage' => $todayTokens >= $tokenAlert,
            ],
            'week' => [
                'requests' => AiQueryLog::where('created_at', '>=', $weekStart)->count(),
                'tokens'   => AiQueryLog::where('created_at', '>=', $weekStart)->sum('tokens_used'),
            ],
            'month' => [
                'requests' => AiQueryLog::where('created_at', '>=', $monthStart)->count(),
                'tokens'   => AiQueryLog::where('created_at', '>=', $monthStart)->sum('tokens_used'),
            ],
        ];

        $byType = AiQueryLog::whereDate('created_at', $today)
            ->selectRaw('type, COUNT(*) as count, SUM(tokens_used) as tokens')
            ->groupBy('type')
            ->get()
            ->map(fn($r) => [
                'type'   => $r->type,
                'count'  => (int) $r->count,
                'tokens' => (int) $r->tokens,
            ]);

        $byProvider = AiQueryLog::whereDate('created_at', $today)
            ->whereNotNull('provider')
            ->selectRaw('provider, COUNT(*) as count')
            ->groupBy('provider')
            ->get()
            ->map(fn($r) => ['provider' => $r->provider, 'count' => (int) $r->count]);

        $usersToday = AiChatUsage::with('user')
            ->where('usage_date', $today)
            ->orderByDesc('count')
            ->get()
            ->map(fn($u) => [
                'user'      => $u->user->name ?? 'Unknown',
                'used'      => $u->count,
                'remaining' => max(0, $limit - $u->count),
                'limit'     => $limit,
                'pct'       => $limit > 0 ? round($u->count / $limit * 100) : 0,
                'near_limit' => ($limit - $u->count) <= (int) ceil($limit * $this->warningThresholdPct() / 100),
            ]);

        $dailyTrend = AiQueryLog::where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw('DATE(created_at) as date, COUNT(*) as requests, SUM(tokens_used) as tokens')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($r) => [
                'date'     => $r->date,
                'requests' => (int) $r->requests,
                'tokens'   => (int) $r->tokens,
            ]);

        return response()->json([
            'summary'     => $summary,
            'by_type'     => $byType,
            'by_provider' => $byProvider,
            'users_today' => $usersToday,
            'daily_trend' => $dailyTrend,
            'config'      => [
                'daily_limit'          => $limit,
                'warning_threshold_pct' => $this->warningThresholdPct(),
                'token_alert_threshold' => $tokenAlert,
            ],
        ], 200);
    }

    // =============================================================
    // PRIVATE HELPERS
    // =============================================================

    private function checkAndIncrementUsage(): bool
    {
        $usage = AiChatUsage::firstOrCreate(
            ['user_id' => auth()->user()->id, 'usage_date' => today()],
            ['count' => 0]
        );

        if ($usage->count >= $this->dailyLimit()) {
            return false;
        }

        $usage->increment('count');
        return true;
    }

    private function currentUsage(): int
    {
        return AiChatUsage::where('user_id', auth()->user()->id)
            ->where('usage_date', today())
            ->value('count') ?? 0;
    }

    private function limitReachedResponse(): JsonResponse
    {
        return response()->json([
            'message'       => 'Daily AI chat limit reached. Resets tomorrow.',
            'limit_reached' => true,
        ], 429);
    }
}
