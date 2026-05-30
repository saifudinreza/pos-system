<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

    // =============================================================
    // QUERY — analisis penjualan natural language
    // POST /api/ai/query
    // Body: { "query": "produk apa yang paling laku bulan ini?" }
    // =============================================================
    public function query(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'max:500'],
        ]);

        // ===== AMBIL DATA PENJUALAN DARI DB =====
        // Data ini yang akan diinject ke prompt Groq
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

        // Data yang dikirim ke Groq
        $salesData = [
            'bulan'           => now()->format('F Y'),
            'total_revenue'   => 'Rp ' . number_format($totalRevenue, 0, ',', '.'),
            'total_orders'    => $totalOrders,
            'produk_terlaris' => $topProducts->toArray(),
        ];

        // Build prompt dan kirim ke Groq
        $systemPrompt = $this->groq->buildSalesPrompt($salesData, $validated['query']);

        try {
            $result = $this->groq->ask($systemPrompt, $validated['query']);
        } catch (\Exception $e) {
            Log::error('AI query error', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'AI sedang tidak tersedia. Coba beberapa saat lagi.'], 503);
        }

        // Simpan log ke database
        AiQueryLog::create([
            'user_id'     => $request->user()->id,
            'type'        => 'sales_analysis',
            'query'       => $validated['query'],
            'response'    => $result['text'],
            'tokens_used' => $result['tokens_used'],
        ]);

        return response()->json([
            'message' => 'AI berhasil menganalisis data penjualan.',
            'data'    => [
                'query'       => $validated['query'],
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'],
                'provider'    => $result['provider'],
                'model'       => $result['model'],
            ],
        ], 200);
    }

    // =============================================================
    // PREDICT STOCK — prediksi kapan stok habis
    // POST /api/ai/predict-stock
    // Body: { "query": "kapan stok Indomie habis?" }
    // =============================================================
    public function predictStock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'max:500'],
        ]);

        // Ambil data stok + rata-rata penjualan harian
        $products = Product::with('category')
            ->withCount([
                'orderItems as total_sold_30_days' => function ($q) {
                    $q->join('orders', 'order_items.order_id', '=', 'orders.id')
                      ->where('orders.status', 'paid')
                      ->where('orders.created_at', '>=', now()->subDays(30));
                    // ↑ Hitung total terjual 30 hari terakhir
                }
            ])
            ->get()
            ->map(fn($p) => [
                'nama'              => $p->name,
                'stok_sekarang'     => $p->stock,
                'batas_alert'       => $p->stock_alert,
                'terjual_30_hari'   => $p->total_sold_30_days ?? 0,
                'rata_per_hari'     => round(($p->total_sold_30_days ?? 0) / 30, 2),
                // ↑ Rata-rata terjual per hari — dasar prediksi AI
                'estimasi_habis'    => ($p->total_sold_30_days ?? 0) > 0
                    ? round($p->stock / (($p->total_sold_30_days ?? 1) / 30)) . ' hari lagi'
                    : 'Tidak ada data penjualan',
                'status'            => $p->stock <= $p->stock_alert ? 'MENIPIS' : 'Normal',
            ]);

        $stockData = [
            'tanggal_analisis' => now()->format('d M Y'),
            'data_produk'      => $products->toArray(),
        ];

        $systemPrompt = $this->groq->buildStockPrompt($stockData, $validated['query']);

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
        ]);

        return response()->json([
            'message' => 'AI berhasil memprediksi stok.',
            'data'    => [
                'query'       => $validated['query'],
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'],
                'provider'    => $result['provider'],
                'model'       => $result['model'],
            ],
        ], 200);
    }

    // =============================================================
    // RECOMMEND — rekomendasi produk / upsell
    // POST /api/ai/recommend
    // Body: { "query": "produk apa yang cocok dijual bareng Indomie?" }
    // =============================================================
    public function recommend(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query'      => ['required', 'string', 'max:500'],
            'product_id' => ['nullable', 'exists:products,id'],
            // ↑ Optional — kalau dikirim, AI fokus ke produk ini
        ]);

        // Ambil pola transaksi — produk apa yang sering dibeli bersamaan
        $patterns = DB::table('order_items as a')
            ->join('order_items as b', function ($join) {
                $join->on('a.order_id', '=', 'b.order_id')
                     ->whereColumn('a.product_id', '!=', 'b.product_id');
                // ↑ Self-join order_items untuk cari produk yang dibeli barengan
                // a dan b adalah produk berbeda dalam order yang sama
            })
            ->join('products as pa', 'a.product_id', '=', 'pa.id')
            ->join('products as pb', 'b.product_id', '=', 'pb.id')
            ->join('orders', 'a.order_id', '=', 'orders.id')
            ->where('orders.status', 'paid')
            ->when($request->filled('product_id'), function ($q) use ($request) {
                $q->where('a.product_id', $request->product_id);
                // ↑ when() = kondisional — hanya filter kalau product_id dikirim
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

        $systemPrompt = $this->groq->buildRecommendationPrompt(
            $transactionData,
            $validated['query']
        );
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
        ]);

        return response()->json([
            'message' => 'AI berhasil memberikan rekomendasi.',
            'data'    => [
                'query'       => $validated['query'],
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'],
                'provider'    => $result['provider'],
                'model'       => $result['model'],
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
}