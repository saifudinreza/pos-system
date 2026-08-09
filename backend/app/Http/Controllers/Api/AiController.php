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
     * Limit kuota AI BULANAN untuk user yang sedang login.
     * FREE = 5 prompt/bulan (trial). Pro/Enterprise = null (tidak dibatasi
     * per bulan — mereka memakai kuota harian, lihat dailyLimit()).
     * developer = null (tak terbatas). Kasir mengikuti plan admin tenant-nya.
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

    /**
     * Limit kuota AI HARIAN untuk user yang sedang login.
     * FREE = null (tetap pakai kuota bulanan), Pro = 10/hari,
     * Enterprise = 50/hari, developer = null (tak terbatas).
     * null = unlimited — jangan pakai ?? untuk fallback!
     */
    private function dailyLimit(): ?int
    {
        return $this->dailyLimitFor(auth()->user());
    }

    /** Versi per-user (dipakai halaman monitoring di stats()). */
    private function dailyLimitFor(?User $user): ?int
    {
        if (! $user || $user->role === 'developer') {
            return null;
        }

        $plan = $this->getEffectivePlan($user);

        if ($plan === 'enterprise') {
            return (int) config('ai.enterprise_daily_limit', 50);
        }

        if ($plan === 'pro') {
            return (int) config('ai.pro_daily_limit', 10);
        }

        return null;
    }

    /** Limit yang BERLAKU untuk user tertentu (dipakai monitoring statistik). */
    private function limitForUser(User $user): ?int
    {
        if ($user->role === 'developer') {
            return null;
        }

        $plan = $this->getEffectivePlan($user);

        if ($plan === 'free') {
            return (int) config('ai.free_monthly_limit', 5);
        }

        if ($plan === 'enterprise') {
            return (int) config('ai.enterprise_daily_limit', 50);
        }

        return (int) config('ai.pro_daily_limit', 10);
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
        $dailyLimit   = $this->dailyLimit();
        $monthlyLimit = $this->monthlyLimit();

        // Free pakai kuota bulanan, Pro/Enterprise pakai kuota harian
        $isDaily    = $dailyLimit !== null;
        $limit      = $dailyLimit ?? $monthlyLimit;
        $used       = $isDaily ? $this->todayUsage() : $this->currentUsage();
        $remaining  = $limit === null ? null : max(0, $limit - $used);

        $warningAt = $limit === null ? 0 : (int) ceil($limit * $this->warningThresholdPct() / 100);
        $isWarning = $remaining !== null && $remaining > 0 && $remaining <= $warningAt;

        return response()->json([
            'used'      => $used,
            'remaining' => $remaining,
            'limit'     => $limit,
            'warning'   => $isWarning,
            'period'    => $isDaily ? 'daily' : 'monthly',
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

        $usage = $this->usagePayload();

        return response()->json([
            'message' => 'AI berhasil menganalisis data penjualan.',
            'data'    => [
                'query'       => $validated['query'],
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'],
                'provider'    => $result['provider'],
                'model'       => $result['model'],
            ],
            'usage' => $usage,
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

        $usage = $this->usagePayload();

        return response()->json([
            'message' => 'AI berhasil memprediksi stok.',
            'data'    => [
                'query'       => $validated['query'],
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'],
                'provider'    => $result['provider'],
                'model'       => $result['model'],
            ],
            'usage' => $usage,
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

        $usage = $this->usagePayload();

        return response()->json([
            'message' => 'AI berhasil memberikan rekomendasi.',
            'data'    => [
                'query'       => $validated['query'],
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'],
                'provider'    => $result['provider'],
                'model'       => $result['model'],
            ],
            'usage' => $usage,
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
                'active_users'     => AiChatUsage::whereDate('usage_date', $today)->tap($scopeFn)->count(),
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
            ->whereDate('usage_date', $today)
            ->tap($scopeFn)
            ->orderByDesc('count')
            ->get()
            ->map(function ($u) {
                // Pro/Enterprise memakai kuota HARIAN → used = pemakaian hari ini;
                // Free memakai kuota BULANAN → used = total sejak awal bulan.
                $isDailyPlan = $u->user && $this->dailyLimitFor($u->user) !== null;
                $used        = $u->user && ! $isDailyPlan
                    ? (int) AiChatUsage::where('user_id', $u->user_id)
                        ->whereDate('usage_date', '>=', now()->startOfMonth())
                        ->sum('count')
                    : (int) $u->count;
                $userLimit   = $u->user ? $this->limitForUser($u->user) : null;
                $remaining   = $userLimit === null ? null : max(0, $userLimit - $used);

                return [
                    'user'       => $u->user->name ?? 'Unknown',
                    'used'       => $used,
                    'remaining'  => $remaining,
                    'limit'      => $userLimit,
                    'pct'        => $userLimit > 0 ? round($used / $userLimit * 100) : null,
                    'near_limit' => $userLimit !== null && ($userLimit - $used) <= (int) ceil($userLimit * $this->warningThresholdPct() / 100),
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
        $dailyLimit   = $this->dailyLimit();
        $monthlyLimit = $this->monthlyLimit();
        $userId       = auth()->user()->id;

        // Semua cek & increment dibungkus DB::transaction + lockForUpdate:
        // request paralel mengantri di baris usage hari ini, jadi dua request
        // tidak bisa sama-sama lolos cek kuota (sebelumnya bisa tembus limit
        // dan kadang kena error unique violation saat bikin baris bersamaan).
        return DB::transaction(function () use ($userId, $dailyLimit, $monthlyLimit) {
            $usage = AiChatUsage::where('user_id', $userId)
                ->whereDate('usage_date', today())
                ->lockForUpdate()
                ->first();

            if (! $usage) {
                try {
                    $usage = AiChatUsage::create([
                        'user_id'    => $userId,
                        'usage_date' => today()->toDateString(),
                        'count'      => 0,
                    ]);
                } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
                    // Request paralel lebih dulu bikin barisnya → ambil & lock lagi
                    $usage = AiChatUsage::where('user_id', $userId)
                        ->whereDate('usage_date', today())
                        ->lockForUpdate()
                        ->firstOrFail();
                }
            }

            // Baca ulang setelah lock — pemakaian paling baru ikut terhitung
            $todayUsed = (int) $usage->count;
            $monthUsed = (int) AiChatUsage::where('user_id', $userId)
                ->whereDate('usage_date', '>=', now()->startOfMonth())
                ->sum('count');

            // Lapis 1: kuota HARIAN (Pro/Enterprise). Free tidak dibatasi per hari.
            if ($dailyLimit !== null && $todayUsed >= $dailyLimit) {
                return false;
            }

            // Lapis 2: kuota BULANAN (Free = 5/bulan). Pro/Enterprise tak terbatas.
            if ($monthlyLimit !== null && $monthUsed >= $monthlyLimit) {
                return false;
            }

            $usage->increment('count');
            return true;
        });
    }

    /** Total prompt yang terpakai bulan ini (menjumlah semua baris usage harian). */
    private function currentUsage(): int
    {
        return (int) (AiChatUsage::where('user_id', auth()->user()->id)
            ->whereDate('usage_date', '>=', now()->startOfMonth())
            ->sum('count') ?? 0);
    }

    /** Total prompt yang terpakai HARI INI (semua tipe endpoint AI). */
    private function todayUsage(): int
    {
        return (int) (AiChatUsage::where('user_id', auth()->user()->id)
            ->whereDate('usage_date', today())
            ->sum('count') ?? 0);
    }

    /** Payload kuota yang dikirim ke frontend setelah sebuah query sukses. */
    private function usagePayload(): array
    {
        $dailyLimit = $this->dailyLimit();
        $limit      = $dailyLimit ?? $this->monthlyLimit();
        $used       = $dailyLimit !== null ? $this->todayUsage() : $this->currentUsage();
        $remaining  = $limit === null ? null : max(0, $limit - $used);
        $warningAt  = $limit === null ? 0 : (int) ceil($limit * $this->warningThresholdPct() / 100);

        return [
            'used'      => $used,
            'remaining' => $remaining,
            'limit'     => $limit,
            'warning'   => $remaining !== null && $remaining > 0 && $remaining <= $warningAt,
        ];
    }

    private function limitReachedResponse(): JsonResponse
    {
        $dailyLimit = $this->dailyLimit();

        $message = $dailyLimit !== null
            ? 'Kuota harian AI sudah habis. Coba lagi besok, atau upgrade paket Enterprise untuk jatah lebih besar.'
            : 'Kuota AI bulanan untuk paket FREE sudah habis. Upgrade ke Pro untuk jatah AI lebih besar.';

        return response()->json([
            'message'       => $message,
            'limit_reached' => true,
        ], 429);
    }
}
