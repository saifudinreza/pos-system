<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesReportExport;

class ReportController extends Controller
{
    // =============================================================
    // SALES REPORT — laporan penjualan
    // GET /api/reports/sales
    // GET /api/reports/sales?period=daily
    // GET /api/reports/sales?period=monthly&year=2026
    // GET /api/reports/sales?date_from=2026-01-01&date_to=2026-05-31
    // =============================================================
    public function sales(Request $request): JsonResponse
    {
        $period   = $request->get('period', 'daily');
        // ↑ Default period = daily
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo   = $request->get('date_to', now()->toDateString());
        // ↑ Default: dari awal bulan ini sampai hari ini

        // ===== SUMMARY CARD =====
        // Data ringkasan untuk card di dashboard
        $summary = Transaction::where('status', 'settlement')
            ->whereBetween('paid_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->selectRaw('
                COUNT(*) as total_transactions,
                SUM(amount) as total_revenue,
                AVG(amount) as avg_transaction
            ')
            ->first();
        // ↑ selectRaw() = pakai raw SQL untuk agregat
        // Lebih fleksibel dari Eloquent untuk query laporan

        $totalOrders = Order::where('status', 'paid')
            ->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->count();

        // ===== CHART DATA — penjualan per periode =====
        if ($period === 'monthly') {
            $year      = $request->get('year', now()->year);
            $chartData = Transaction::where('status', 'settlement')
                ->whereYear('paid_at', $year)
                ->selectRaw('
                    MONTH(paid_at) as period,
                    MONTHNAME(paid_at) as label,
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_revenue
                ')
                ->groupBy('period', 'label')
                ->orderBy('period')
                ->get();
            // ↑ Group by bulan — untuk grafik penjualan bulanan

        } else {
            // Daily — 30 hari terakhir
            $chartData = Transaction::where('status', 'settlement')
                ->whereBetween('paid_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
                ->selectRaw('
                    DATE(paid_at) as period,
                    DATE_FORMAT(paid_at, "%d %b") as label,
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_revenue
                ')
                ->groupBy('period', 'label')
                ->orderBy('period')
                ->get();
            // ↑ Group by hari — untuk grafik penjualan harian
        }

        // ===== TOP PRODUCTS — produk terlaris =====
        $topProducts = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', 'paid')
            ->whereBetween('orders.created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->selectRaw('
                products.id,
                products.name,
                products.sku,
                SUM(order_items.quantity) as total_quantity,
                SUM(order_items.subtotal) as total_revenue
            ')
            ->groupBy('products.id', 'products.name', 'products.sku')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get();
        // ↑ Join 3 tabel untuk dapat produk terlaris
        // Diurutkan by total quantity terjual

        // ===== RECENT TRANSACTIONS =====
        $recentTransactions = Transaction::with('order.user')
            ->where('status', 'settlement')
            ->latest('paid_at')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'order_number'   => $t->order->order_number,
                'customer'       => $t->order->user->name,
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
                    'total_revenue'      => $summary->total_revenue ?? 0,
                    'avg_transaction'    => round($summary->avg_transaction ?? 0, 2),
                    'total_orders'       => $totalOrders,
                ],
                'chart_data'          => $chartData,
                'top_products'        => $topProducts,
                'recent_transactions' => $recentTransactions,
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

        // Ambil data untuk laporan
        $transactions = Transaction::with('order.user')
            ->where('status', 'settlement')
            ->whereBetween('paid_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
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
