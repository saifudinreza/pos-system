<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\OrderItem;
use App\Services\ForecastService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesReportExport;

class ReportController extends Controller
{
    // =============================================================
    // FORECAST — prediksi penjualan 7 hari ke depan (deterministik)
    // GET /api/reports/forecast
    // =============================================================
    public function forecast(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        return response()->json([
            'message' => 'Forecast penjualan berhasil dihitung.',
            'data'    => ForecastService::forecastForTenant($tenantId),
        ], 200);
    }

    // =============================================================
    // SALES REPORT — laporan penjualan
    // GET /api/reports/sales
    // GET /api/reports/sales?period=daily
    // GET /api/reports/sales?period=monthly&year=2026
    // GET /api/reports/sales?date_from=2026-01-01&date_to=2026-05-31
    // =============================================================
    public function sales(Request $request): JsonResponse
    {
        $period    = $request->get('period', 'daily');
        $dateFrom  = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo    = $request->get('date_to', now()->toDateString());
        $tenantId  = $request->user()->tenant_id;

        // ===== SUMMARY CARD =====
        $summary = Transaction::where('status', 'settlement')
            ->whereBetween('paid_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->when($tenantId, fn($q) => $q->whereHas('order', fn($o) => $o->where('tenant_id', $tenantId)))
            ->selectRaw('
                COUNT(*) as total_transactions,
                SUM(amount) as total_revenue,
                AVG(amount) as avg_transaction
            ')
            ->first();

        $totalOrders = Order::where('status', 'paid')
            ->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->count();

        $totalItems = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'paid')
            ->when($tenantId, fn($q) => $q->where('orders.tenant_id', $tenantId))
            ->whereBetween('orders.created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->sum('order_items.quantity');

        // ===== COGS & PROFIT =====
        // Modal terjual = jumlah item × harga modal saat transaksi (snapshot).
        // Item tanpa cost (produk lama / belum diisi) dihitung 0.
        $totalCogs = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'paid')
            ->when($tenantId, fn($q) => $q->where('orders.tenant_id', $tenantId))
            ->whereBetween('orders.created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->selectRaw('COALESCE(SUM(order_items.quantity * order_items.cost), 0) as cogs')
            ->value('cogs');

        $totalRevenue = (float) ($summary->total_revenue ?? 0);
        $grossProfit  = $totalRevenue - (float) $totalCogs;
        $profitMargin = $totalRevenue > 0 ? (float) round(($grossProfit / $totalRevenue) * 100, 1) : 0.0;

        $totalCustomers = Order::where('status', 'paid')
            ->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->distinct('user_id')
            ->count('user_id');

        $paymentBreakdown = Transaction::where('status', 'settlement')
            ->whereBetween('paid_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->when($tenantId, fn($q) => $q->whereHas('order', fn($o) => $o->where('tenant_id', $tenantId)))
            ->selectRaw('COALESCE(payment_method, "other") as method, COUNT(*) as total_count, SUM(amount) as total_amount')
            ->groupBy('method')
            ->get()
            ->map(fn($t) => [
                'method' => $t->method,
                'count'  => (int) $t->total_count,
                'total'  => (float) $t->total_amount,
            ])
            ->values();

        // ===== CHART DATA — penjualan per periode =====
        // Label diformat di PHP (bukan SQL) supaya query portabel
        // (SQLite tidak punya DATE_FORMAT/MONTHNAME, hanya DATE/MONTH).
        if ($period === 'monthly') {
            $year      = $request->get('year', now()->year);
            $chartData = Transaction::where('status', 'settlement')
                ->whereYear('paid_at', $year)
                ->when($tenantId, fn($q) => $q->whereHas('order', fn($o) => $o->where('tenant_id', $tenantId)))
                ->selectRaw('
                    MONTH(paid_at) as period,
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_revenue
                ')
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->map(fn($r) => [
                    'period'             => (int) $r->period,
                    'label'              => \Illuminate\Support\Carbon::create()->month($r->period)->translatedFormat('F'),
                    'total_transactions' => (int) $r->total_transactions,
                    'total_revenue'      => (float) $r->total_revenue,
                ]);
        } else {
            $chartData = Transaction::where('status', 'settlement')
                ->whereBetween('paid_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
                ->when($tenantId, fn($q) => $q->whereHas('order', fn($o) => $o->where('tenant_id', $tenantId)))
                ->selectRaw('
                    DATE(paid_at) as period,
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_revenue
                ')
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->map(fn($r) => [
                    'period'             => $r->period,
                    'label'              => \Illuminate\Support\Carbon::parse($r->period)->format('d M'),
                    'total_transactions' => (int) $r->total_transactions,
                    'total_revenue'      => (float) $r->total_revenue,
                ]);
        }

        // ===== TOP PRODUCTS — produk terlaris =====
        $topProducts = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', 'paid')
            ->when($tenantId, fn($q) => $q->where('orders.tenant_id', $tenantId))
            ->whereBetween('orders.created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->selectRaw('
                products.id,
                products.name,
                products.sku,
                SUM(order_items.quantity) as total_quantity,
                SUM(order_items.subtotal) as total_revenue,
                COALESCE(SUM(order_items.quantity * order_items.cost), 0) as total_cogs
            ')
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get()
            ->map(fn($p) => [
                'id'             => $p->id,
                'name'           => $p->name,
                'sku'            => $p->sku,
                'total_quantity' => (int) $p->total_quantity,
                'total_revenue'  => (float) $p->total_revenue,
                'total_cogs'     => (float) $p->total_cogs,
                'profit'         => (float) $p->total_revenue - (float) $p->total_cogs,
            ]);

        // ===== RECENT TRANSACTIONS =====
        $recentTransactions = Transaction::with('order.user')
            ->where('status', 'settlement')
            ->when($tenantId, fn($q) => $q->whereHas('order', fn($o) => $o->where('tenant_id', $tenantId)))
            ->latest('paid_at')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'order_number'   => $t->order?->order_number ?? '-',
                'customer'       => $t->order?->user?->name ?? '-',
                'amount'         => $t->amount,
                'payment_method' => $t->payment_method,
                'paid_at'        => $t->paid_at->format('d M Y H:i'),
            ]);

        return response()->json([
            'message' => 'Laporan penjualan berhasil diambil.',
            'data'    => [
                'period'              => $period,
                'date_from'           => $dateFrom,
                'date_to'             => $dateTo,
                'summary'             => [
                    'total_transactions' => $summary->total_transactions ?? 0,
                    'total_revenue'      => $totalRevenue,
                    'avg_transaction'    => round($summary->avg_transaction ?? 0, 2),
                    'total_orders'       => $totalOrders,
                    'total_items'        => (int) $totalItems,
                    'total_customers'    => $totalCustomers,
                    'total_cogs'         => round((float) $totalCogs, 2),
                    'gross_profit'       => round($grossProfit, 2),
                    'profit_margin'      => $profitMargin,
                ],
                'chart_data'          => $chartData,
                'top_products'        => $topProducts,
                'recent_transactions' => $recentTransactions,
                'payment_breakdown'   => $paymentBreakdown,
            ],
        ], 200);
    }

    // =============================================================
    // STOCK REPORT — laporan stok produk
    // GET /api/reports/stock
    // GET /api/reports/stock?category_id=1&low_stock=true
    // =============================================================
    public function stock(Request $request): JsonResponse
    {
        $query = Product::with('category')
            ->withCount([
                'orderItems as total_sold' => function ($q) {
                    $q->join('orders', 'order_items.order_id', '=', 'orders.id')
                        ->where('orders.status', 'paid');
                }
                // ↑ Hitung total terjual dari order yang sudah paid
            ]);

        // ----- FILTER KATEGORI -----
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // ----- FILTER STOK MENIPIS -----
        if ($request->boolean('low_stock')) {
            $query->whereColumn('stock', '<=', 'stock_alert');
            // ↑ Tampilkan hanya produk yang stoknya sudah mepet
        }

        $products = $query->orderBy('stock', 'asc')->get();
        // ↑ Urutkan dari stok paling sedikit
        // Supaya produk yang mau habis muncul di atas

        // Summary stok
        $summary = [
            'total_products'     => $products->count(),
            'low_stock_count'    => $products->filter(fn($p) => $p->isLowStock())->count(),
            // ↑ Berapa produk yang stoknya sudah di bawah alert
            'out_of_stock_count' => $products->filter(fn($p) => $p->stock === 0)->count(),
            // ↑ Berapa produk yang stoknya 0
            'total_stock_value'  => $products->sum(fn($p) => $p->stock * $p->price),
            // ↑ Total nilai stok = jumlah stok × harga per produk
        ];

        return response()->json([
            'message' => 'Laporan stok berhasil diambil.',
            'data'    => [
                'summary'  => $summary,
                'products' => $products->map(fn($p) => [
                    'id'           => $p->id,
                    'name'         => $p->name,
                    'sku'          => $p->sku,
                    'category'     => $p->category->name,
                    'stock'        => $p->stock,
                    'stock_alert'  => $p->stock_alert,
                    'is_low_stock' => $p->isLowStock(),
                    'total_sold'   => $p->total_sold ?? 0,
                    'stock_value'  => $p->stock * $p->price,
                    // ↑ Nilai stok produk ini: qty × harga
                ]),
            ],
        ], 200);
    }

    // =============================================================
    // DOWNLOAD SALES — download laporan penjualan sebagai PDF
    // GET /api/reports/sales/download?format=pdf
    // GET /api/reports/sales/download?format=excel
    // =============================================================
    public function downloadSales(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo   = $request->get('date_to', now()->toDateString());
        $format   = $request->get('format', 'pdf');

        // Export PDF/Excel hanya untuk Pro & Enterprise
        if ($this->getEffectivePlan($request->user()) === 'free') {
            return response()->json([
                'message'       => 'Export laporan (PDF/Excel) hanya tersedia untuk paket Pro & Enterprise. Upgrade untuk mengaktifkannya.',
                'plan_required' => 'pro',
            ], 403);
        }

        $tenantId = $request->user()->tenant_id;

        // Ambil data untuk laporan — wajib filter tenant (Transaction tidak punya tenant_id)
        $transactions = Transaction::with('order.user')
            ->where('status', 'settlement')
            ->whereBetween('paid_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->when($tenantId, fn($q) => $q->whereHas('order', fn($o) => $o->where('tenant_id', $tenantId)))
            ->latest('paid_at')
            ->get();

        $totalRevenue = $transactions->sum('amount');

        if ($format === 'excel') {
            // ===== DOWNLOAD EXCEL =====
            return Excel::download(
                new SalesReportExport($transactions, $dateFrom, $dateTo),
                'laporan-penjualan-' . $dateFrom . '-' . $dateTo . '.xlsx'
            );
            // ↑ Pakai class Export terpisah — kita buat setelah ini
        }

        // ===== DOWNLOAD PDF =====
        $pdf = Pdf::loadView('reports.sales', [
            'transactions' => $transactions,
            'date_from'    => $dateFrom,
            'date_to'      => $dateTo,
            'total_revenue' => $totalRevenue,
            'generated_at' => now()->format('d M Y H:i'),
        ])
            ->setPaper('a4', 'portrait');
        // ↑ loadView() = render blade template jadi PDF
        // Kita perlu buat blade template-nya juga

        return $pdf->download('laporan-penjualan-' . $dateFrom . '-' . $dateTo . '.pdf');
        // ↑ download() = langsung trigger download di browser
        // Bukan return JSON seperti endpoint lain
    }

    // =============================================================
    // DOWNLOAD STOCK — download laporan stok sebagai PDF/Excel
    // GET /api/reports/stock/download?format=pdf
    // =============================================================
    public function downloadStock(Request $request)
    {
        // Export PDF/Excel hanya untuk Pro & Enterprise
        if ($this->getEffectivePlan($request->user()) === 'free') {
            return response()->json([
                'message'       => 'Export laporan (PDF/Excel) hanya tersedia untuk paket Pro & Enterprise. Upgrade untuk mengaktifkannya.',
                'plan_required' => 'pro',
            ], 403);
        }

        $format   = $request->get('format', 'pdf');

        $products = Product::with('category')
            ->orderBy('stock', 'asc')
            ->get();

        if ($format === 'excel') {
            return Excel::download(
                new \App\Exports\StockReportExport($products),
                'laporan-stok-' . now()->format('Y-m-d') . '.xlsx'
            );
        }

        $pdf = Pdf::loadView('reports.stock', [
            'products'     => $products,
            'generated_at' => now()->format('d M Y H:i'),
        ])
            ->setPaper('a4', 'portrait');

        return $pdf->download('laporan-stok-' . now()->format('Y-m-d') . '.pdf');
    }
}
