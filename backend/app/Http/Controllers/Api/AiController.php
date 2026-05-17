<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiQueryLog;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AiController extends Controller
{
    public function __construct(private GeminiService $gemini) {}

    public function analyze(Request $request)
    {
        $request->validate([
            'query' => 'required|string|max:500',
            'type'  => 'required|in:sales_analysis,stock_prediction,recommendation',
        ]);

        $context = $this->buildContext($request->type);
        $prompt  = "Kamu adalah asisten AI untuk sistem POS. Jawab dalam Bahasa Indonesia, singkat dan actionable.\n\n"
                 . $context
                 . "\n\nPertanyaan: " . $request->query;

        $result = $this->gemini->ask($prompt);

        AiQueryLog::create([
            'user_id'     => Auth::id(),
            'type'        => $request->type,
            'query'       => $request->query,
            'response'    => $result['text'],
            'tokens_used' => $result['tokens'],
        ]);

        return response()->json(['response' => $result['text']]);
    }

    private function buildContext(string $type): string
    {
        return match ($type) {
            'sales_analysis'   => $this->getSalesContext(),
            'stock_prediction' => $this->getStockContext(),
            'recommendation'   => $this->getRecommendationContext(),
        };
    }

    private function getSalesContext(): string
    {
        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'paid')
            ->where('orders.created_at', '>=', now()->subDays(30))
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_sold'), DB::raw('SUM(order_items.subtotal) as revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get();

        $totalRevenue = DB::table('orders')
            ->where('status', 'paid')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('total');

        $lines = [
            'Data penjualan 30 hari terakhir:',
            'Total pendapatan: Rp ' . number_format($totalRevenue, 0, ',', '.'),
            'Top 10 produk terlaris:',
        ];

        foreach ($topProducts as $p) {
            $lines[] = "- {$p->name}: terjual {$p->total_sold} pcs, pendapatan Rp " . number_format($p->revenue, 0, ',', '.');
        }

        return implode("\n", $lines);
    }

    private function getStockContext(): string
    {
        $products = DB::table('products')
            ->where('is_active', true)
            ->select('name', 'stock', 'stock_alert')
            ->orderBy('stock')
            ->limit(20)
            ->get();

        $lines = ['Data stok produk saat ini:'];

        foreach ($products as $p) {
            $status  = $p->stock <= $p->stock_alert ? ' [KRITIS]' : '';
            $lines[] = "- {$p->name}: stok {$p->stock}, batas alert {$p->stock_alert}{$status}";
        }

        return implode("\n", $lines);
    }

    private function getRecommendationContext(): string
    {
        $products = DB::table('products')
            ->leftJoin('order_items', 'products.id', '=', 'order_items.product_id')
            ->where('products.is_active', true)
            ->select('products.name', 'products.stock', DB::raw('COALESCE(SUM(order_items.quantity), 0) as total_sold'))
            ->groupBy('products.id', 'products.name', 'products.stock')
            ->orderBy('total_sold')
            ->limit(10)
            ->get();

        $lines = ['Produk dengan penjualan rendah:'];

        foreach ($products as $p) {
            $lines[] = "- {$p->name}: stok {$p->stock}, total terjual {$p->total_sold} pcs";
        }

        return implode("\n", $lines);
    }
}
