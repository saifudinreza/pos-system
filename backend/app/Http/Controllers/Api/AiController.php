<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiChatUsage;
use App\Models\AiQueryLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use App\Services\GroqService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    public function __construct(private GroqService $groq) {}

    /**
     * Limit kuota AI untuk user yang sedang login.
     * FREE = 5 prompt/bulan (trial), PRO/Enterprise = tak terbatas (null),
     * developer = tak terbatas. Kasir mengikuti plan admin tenant-nya.
     */
    private function monthlyLimit(): ?int
    {
        $user = auth()->user();

        if (! $user || $user->role === 'developer') {
            return null;
        }

        $plan = $this->getEffectivePlan($user);

        return $plan === 'free' ? (int) config('ai.free_monthly_limit', 5) : null;
    }

    /** Limit untuk user tertentu (dipakai monitoring statistik). */
    private function limitForUser(User $user): ?int
    {
        if ($user->role === 'developer') {
            return null;
        }

        $plan = $this->getEffectivePlan($user);

        return $plan === 'free' ? (int) config('ai.free_monthly_limit', 5) : null;
    }

    private function warningThresholdPct(): int
    {
        return config('ai.warning_threshold_pct', 30);
    }

    // =============================================================
    // USAGE — sisa kuota AI user yang login (dihitung per bulan)
    // GET /api/ai/usage-today
    // =============================================================
    public function usageToday(): JsonResponse
    {
        $limit     = $this->monthlyLimit();
        $used      = $this->currentUsage();
        $remaining = $limit === null ? null : max(0, $limit - $used);

        $warningAt = $limit === null ? 0 : (int) ceil($limit * $this->warningThresholdPct() / 100);
        $isWarning = $remaining !== null && $remaining > 0 && $remaining <= $warningAt;

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

        $tenantId = $request->user()->tenant_id;

        // ===== PENJUALAN PER PERIODE — supaya AI tidak salah kira periode =====
        // Sebelumnya cuma data bulan ini yang dikirim, jadi pertanyaan "minggu ini"
        // atau "hari ini" tetap dijawab pakai angka bulanan. Sekarang kita hitung
        // ketiganya sekaligus dan biarkan AI pilih sesuai kata dalam pertanyaan user.
        // CATATAN: Transaction tidak punya tenant_id — isolasi tenant wajib manual
        // via whereHas('order', tenant_id), sama seperti di ReportController.
        $periods = [
            'hari_ini'   => [now()->startOfDay(), now()->endOfDay()],
            'minggu_ini' => [now()->startOfWeek(), now()->endOfWeek()],
            'bulan_ini'  => [now()->startOfMonth(), now()->endOfMonth()],
        ];

        $penjualanPerPeriode = [];
        foreach ($periods as $label => [$start, $end]) {
            $revenue = Transaction::where('status', 'settlement')
                ->whereBetween('paid_at', [$start, $end])
                ->when($tenantId, fn($q) => $q->whereHas('order', fn($o) => $o->where('tenant_id', $tenantId)))
                ->sum('amount');

            $orders = Order::where('status', 'paid')
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $penjualanPerPeriode[$label] = [
                'total_revenue' => 'Rp ' . number_format($revenue, 0, ',', '.'),
                'total_orders'  => $orders,
            ];
        }

        $topProducts = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', 'paid')
            ->when($tenantId, fn($q) => $q->where('orders.tenant_id', $tenantId))
            ->whereBetween('orders.created_at', $periods['bulan_ini'])
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

        // ===== KATALOG PRODUK & STOK — supaya pertanyaan stok/produk juga
        // bisa dijawab dari chat utama, tidak perlu endpoint terpisah =====
        $catalog = Product::with('category')
            ->where('is_active', true)
            ->get()
            ->map(fn($p) => [
                'nama'     => $p->name,
                'sku'      => $p->sku,
                'kategori' => $p->category?->name,
                'harga'    => 'Rp ' . number_format($p->price, 0, ',', '.'),
                'stok'     => $p->stock,
                'status_stok' => $p->isLowStock() ? 'MENIPIS' : 'Normal',
            ]);

        $salesData = [
            'tanggal_sekarang'          => now()->format('l, d F Y'),
            'penjualan_per_periode'     => $penjualanPerPeriode,
            'produk_terlaris_bulan_ini' => $topProducts->toArray(),
            'katalog_dan_stok_produk'   => $catalog->toArray(),
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
        $limit      = $this->monthlyLimit();
        $remaining  = $limit === null ? null : max(0, $limit - $usageAfter);
        $warningAt  = $limit === null ? 0 : (int) ceil($limit * $this->warningThresholdPct() / 100);

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
                'warning'   => $remaining !== null && $remaining > 0 && $remaining <= $warningAt,
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

        $tenantId = $request->user()->tenant_id;

        $products = Product::with('category')
            ->withCount([
                'orderItems as total_sold_30_days' => function ($q) use ($tenantId) {
                    $q->join('orders', 'order_items.order_id', '=', 'orders.id')
                      ->where('orders.status', 'paid')
                      ->when($tenantId, fn($o) => $o->where('orders.tenant_id', $tenantId))
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
        $limit      = $this->monthlyLimit();
        $remaining  = $limit === null ? null : max(0, $limit - $usageAfter);
        $warningAt  = $limit === null ? 0 : (int) ceil($limit * $this->warningThresholdPct() / 100);

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
                'warning'   => $remaining !== null && $remaining > 0 && $remaining <= $warningAt,
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

        $tenantId = $request->user()->tenant_id;

        $patterns = DB::table('order_items as a')
            ->join('order_items as b', function ($join) {
                $join->on('a.order_id', '=', 'b.order_id')
                     ->whereColumn('a.product_id', '!=', 'b.product_id');
            })
            ->join('products as pa', 'a.product_id', '=', 'pa.id')
            ->join('products as pb', 'b.product_id', '=', 'pb.id')
            ->join('orders', 'a.order_id', '=', 'orders.id')
            ->where('orders.status', 'paid')
            ->when($tenantId, fn($q) => $q->where('orders.tenant_id', $tenantId))
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
        $limit      = $this->monthlyLimit();
        $remaining  = $limit === null ? null : max(0, $limit - $usageAfter);
        $warningAt  = $limit === null ? 0 : (int) ceil($limit * $this->warningThresholdPct() / 100);

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
                'warning'   => $remaining !== null && $remaining > 0 && $remaining <= $warningAt,
            ],
        ], 200);
    }

    // =============================================================
    // LOGS — riwayat query AI
    // GET /api/ai/logs
    // =============================================================
    public function logs(): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;

        $logs = AiQueryLog::with('user')
            ->whereHas('user', fn($q) => $q
                ->where('role', '!=', 'developer')
                ->when($tenantId, fn($u) => $u->where('tenant_id', $tenantId)))
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
        $limit      = $this->monthlyLimit();
        $tokenAlert = config('ai.token_alert_threshold', 50000);

        // Admin hanya melihat data user dalam tenant-nya sendiri;
        // developer (tenant_id null) melihat semua tenant.
        $tenantId = auth()->user()->tenant_id;
        $scopeFn  = function ($q) use ($tenantId) {
            $q->whereHas('user', function ($u) use ($tenantId) {
                $u->where('role', '!=', 'developer');
                if ($tenantId) {
                    $u->where('tenant_id', $tenantId);
                }
            });
        };

        $todayTokens = AiQueryLog::whereDate('created_at', $today)->tap($scopeFn)->sum('tokens_used');

        $summary = [
            'today' => [
                'requests'         => AiQueryLog::whereDate('created_at', $today)->tap($scopeFn)->count(),
                'tokens'           => $todayTokens,
                'active_users'     => AiChatUsage::where('usage_date', $today)->tap($scopeFn)->count(),
                'high_token_usage' => $todayTokens >= $tokenAlert,
            ],
            'week' => [
                'requests' => AiQueryLog::where('created_at', '>=', $weekStart)->tap($scopeFn)->count(),
                'tokens'   => AiQueryLog::where('created_at', '>=', $weekStart)->tap($scopeFn)->sum('tokens_used'),
            ],
            'month' => [
                'requests' => AiQueryLog::where('created_at', '>=', $monthStart)->tap($scopeFn)->count(),
                'tokens'   => AiQueryLog::where('created_at', '>=', $monthStart)->tap($scopeFn)->sum('tokens_used'),
            ],
        ];

        $byType = AiQueryLog::whereDate('created_at', $today)
            ->tap($scopeFn)
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
            ->tap($scopeFn)
            ->selectRaw('provider, COUNT(*) as count')
            ->groupBy('provider')
            ->get()
            ->map(fn($r) => ['provider' => $r->provider, 'count' => (int) $r->count]);

        $monthStart = now()->startOfMonth();
        $usersToday = AiChatUsage::with('user')
            ->where('usage_date', $today)
            ->tap($scopeFn)
            ->orderByDesc('count')
            ->get()
            ->map(function ($u) {
                $monthlyUsed = $u->user
                    ? (int) AiChatUsage::where('user_id', $u->user_id)
                        ->where('usage_date', '>=', now()->startOfMonth())
                        ->tap(fn($q) => $q->whereNotNull('user_id'))
                        ->sum('count')
                    : $u->count;
                $userLimit   = $u->user ? $this->limitForUser($u->user) : null;
                $remaining   = $userLimit === null ? null : max(0, $userLimit - $monthlyUsed);

                return [
                    'user'       => $u->user->name ?? 'Unknown',
                    'used'       => $monthlyUsed,
                    'remaining'  => $remaining,
                    'limit'      => $userLimit,
                    'pct'        => $userLimit > 0 ? round($monthlyUsed / $userLimit * 100) : null,
                    'near_limit' => $userLimit !== null && ($userLimit - $monthlyUsed) <= (int) ceil($userLimit * $this->warningThresholdPct() / 100),
                ];
            });

        $dailyTrend = AiQueryLog::where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->tap($scopeFn)
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
                'free_monthly_limit'   => (int) config('ai.free_monthly_limit', 5),
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
        $limit = $this->monthlyLimit();

        $usage = AiChatUsage::firstOrCreate(
            ['user_id' => auth()->user()->id, 'usage_date' => today()],
            ['count' => 0]
        );

        // Paket PRO/Enterprise (limit null) = tak terbatas, tetap dicatat untuk monitoring.
        if ($limit !== null && $this->currentUsage() >= $limit) {
            return false;
        }

        $usage->increment('count');
        return true;
    }

    /** Total prompt yang terpakai bulan ini (menjumlah semua baris usage harian). */
    private function currentUsage(): int
    {
        return (int) (AiChatUsage::where('user_id', auth()->user()->id)
            ->where('usage_date', '>=', now()->startOfMonth()->toDateString())
            ->sum('count') ?? 0);
    }

    private function limitReachedResponse(): JsonResponse
    {
        return response()->json([
            'message'       => 'Kuota AI bulanan untuk paket FREE sudah habis. Upgrade ke Pro untuk AI tak terbatas.',
            'limit_reached' => true,
        ], 429);
    }
}
