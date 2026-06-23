<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    public function current(Request $request): JsonResponse
    {
        $shift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        if (!$shift) {
            $suggested = Shift::getShiftForTime();
            return response()->json([
                'message' => 'Tidak ada shift yang sedang berjalan.',
                'data'    => null,
                'suggested_shift' => [
                    'number' => $suggested[0],
                    'name'   => $suggested[1],
                ],
            ], 200);
        }

        $orderCount = Order::where('shift_id', $shift->id)->count();
        $totalSales = Order::where('shift_id', $shift->id)
            ->where('status', 'paid')
            ->sum('total');

        return response()->json([
            'message' => 'Shift aktif ditemukan.',
            'data'    => $this->formatShift($shift, $orderCount, $totalSales),
        ], 200);
    }

    public function open(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'opening_balance' => ['required', 'numeric', 'min:0'],
        ]);

        $active = Shift::where('user_id', $request->user()->id)
            ->where('status', 'open')
            ->exists();

        if ($active) {
            return response()->json([
                'message' => 'Kamu masih memiliki shift yang sedang berjalan. Tutup shift terlebih dahulu.',
            ], 422);
        }

        [$number, $name] = Shift::getShiftForTime();

        $sameDayClosed = Shift::where('user_id', $request->user()->id)
            ->where('shift_number', $number)
            ->whereDate('opened_at', today())
            ->exists();

        if ($sameDayClosed) {
            return response()->json([
                'message' => "Shift {$name} ({$number}) hari ini sudah pernah dibuka dan ditutup.",
            ], 422);
        }

        $shift = Shift::create([
            'tenant_id'       => $request->user()->tenant_id,
            'user_id'         => $request->user()->id,
            'shift_number'    => $number,
            'shift_name'      => $name,
            'status'          => 'open',
            'opened_at'       => now(),
            'opening_balance' => $validated['opening_balance'],
        ]);

        return response()->json([
            'message' => "Shift {$name} berhasil dibuka.",
            'data'    => $this->formatShift($shift),
        ], 201);
    }

    public function close(Request $request, int $id): JsonResponse
    {
        $shift = Shift::find($id);

        if (!$shift) {
            return response()->json(['message' => 'Shift tidak ditemukan.'], 404);
        }

        if ($shift->status === 'closed') {
            return response()->json(['message' => 'Shift ini sudah ditutup.'], 422);
        }

        if ($shift->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Kamu tidak punya akses ke shift ini.'], 403);
        }

        $validated = $request->validate([
            'closing_balance' => ['required', 'numeric', 'min:0'],
            'notes'           => ['nullable', 'string', 'max:500'],
        ]);

        $paidOrders = Order::where('shift_id', $shift->id)
            ->where('status', 'paid')
            ->get();

        $cashTotal = Transaction::whereIn('order_id', $paidOrders->pluck('id'))
            ->where('payment_method', 'cash')
            ->where('status', 'settlement')
            ->sum('amount');

        $expectedBalance = $shift->opening_balance + $cashTotal;
        $difference = $validated['closing_balance'] - $expectedBalance;

        $shift->update([
            'status'           => 'closed',
            'closed_at'        => now(),
            'closing_balance'  => $validated['closing_balance'],
            'expected_balance' => $expectedBalance,
            'difference'       => $difference,
            'notes'            => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => "Shift {$shift->shift_name} berhasil ditutup.",
            'data'    => $this->formatShift($shift->fresh()),
        ], 200);
    }

    public function report(Request $request, int $id): JsonResponse
    {
        $shift = Shift::with('user')->find($id);

        if (!$shift) {
            return response()->json(['message' => 'Shift tidak ditemukan.'], 404);
        }

        $orders = Order::with(['items.product', 'transaction', 'user'])
            ->where('shift_id', $shift->id)
            ->latest()
            ->get();

        $paidOrders = $orders->where('status', 'paid');
        $pendingOrders = $orders->where('status', 'pending');
        $cancelledOrders = $orders->where('status', 'cancelled');

        $totalOrders = $orders->count();
        $totalPaid = $paidOrders->count();
        $totalRevenue = $paidOrders->sum('total');
        $totalItems = $paidOrders->sum(fn($o) => $o->items->sum('quantity'));

        $paymentBreakdown = Transaction::whereIn('order_id', $paidOrders->pluck('id'))
            ->where('status', 'settlement')
            ->selectRaw('COALESCE(payment_method, "other") as method, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('method')
            ->get()
            ->map(fn($t) => [
                'method' => $t->method,
                'count'  => (int) $t->count,
                'total'  => (float) $t->total,
            ]);

        $cashTransactions = Transaction::whereIn('order_id', $paidOrders->pluck('id'))
            ->where('payment_method', 'cash')
            ->where('status', 'settlement')
            ->get();

        $expectedCash = $shift->opening_balance + $cashTransactions->sum('amount');

        return response()->json([
            'message' => 'Laporan shift berhasil diambil.',
            'data'    => [
                'shift' => $this->formatShift($shift),
                'summary' => [
                    'total_orders'    => $totalOrders,
                    'total_paid'      => $totalPaid,
                    'total_revenue'   => (float) $totalRevenue,
                    'total_items'     => $totalItems,
                    'pending_count'   => $pendingOrders->count(),
                    'cancelled_count' => $cancelledOrders->count(),
                ],
                'cash_summary' => [
                    'opening_balance'  => (float) $shift->opening_balance,
                    'cash_sales'       => (float) $cashTransactions->sum('amount'),
                    'cash_count'       => $cashTransactions->count(),
                    'expected_cash'    => (float) $expectedCash,
                    'closing_balance'  => (float) ($shift->closing_balance ?? 0),
                    'difference'       => (float) ($shift->difference ?? 0),
                ],
                'payment_breakdown' => $paymentBreakdown,
                'orders' => $paidOrders->map(fn($o) => [
                    'id'             => $o->id,
                    'order_number'   => $o->order_number,
                    'subtotal'       => $o->subtotal,
                    'tax'            => $o->tax,
                    'total'          => $o->total,
                    'payment_method' => $o->transaction?->payment_method,
                    'item_count'     => $o->items->sum('quantity'),
                    'cashier'        => $o->user?->name ?? '-',
                    'created_at'     => $o->created_at->format('d M Y H:i'),
                ]),
            ],
        ], 200);
    }

    public function index(Request $request): JsonResponse
    {
        $shifts = Shift::with('user')
            ->latest('opened_at')
            ->paginate(20);

        $shifts->getCollection()->transform(function ($shift) {
            $orderCount = Order::where('shift_id', $shift->id)->count();
            $totalSales = Order::where('shift_id', $shift->id)
                ->where('status', 'paid')
                ->sum('total');
            return $this->formatShift($shift, $orderCount, $totalSales);
        });

        return response()->json([
            'message' => 'Daftar shift berhasil diambil.',
            'data'    => $shifts->items(),
            'meta'    => [
                'current_page' => $shifts->currentPage(),
                'per_page'     => $shifts->perPage(),
                'total'        => $shifts->total(),
                'last_page'    => $shifts->lastPage(),
            ],
        ], 200);
    }

    private function formatShift(Shift $shift, int $orderCount = 0, float $totalSales = 0): array
    {
        return [
            'id'              => $shift->id,
            'shift_number'    => $shift->shift_number,
            'shift_name'      => $shift->shift_name,
            'status'          => $shift->status,
            'opened_at'       => $shift->opened_at->format('d M Y H:i'),
            'closed_at'       => $shift->closed_at?->format('d M Y H:i'),
            'opening_balance' => (float) $shift->opening_balance,
            'closing_balance' => (float) ($shift->closing_balance ?? 0),
            'expected_balance' => (float) ($shift->expected_balance ?? 0),
            'difference'      => (float) ($shift->difference ?? 0),
            'notes'           => $shift->notes,
            'user'            => $shift->relationLoaded('user') ? [
                'id'   => $shift->user->id,
                'name' => $shift->user->name,
            ] : null,
            'order_count'     => $orderCount,
            'total_sales'     => $totalSales,
            'created_at'      => $shift->created_at->format('d M Y H:i'),
        ];
    }
}
