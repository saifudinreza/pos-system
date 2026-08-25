<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Order;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * ShiftController, buka/tutup shift & laporan shift.
 *
 * Shift bersifat PER-TENANT, bukan per-user: satu shift aktif dipakai bersama
 * semua kasir dalam tenant yang sama (TenantScope otomatis membatasi query).
 * Transaksi diblokir di luar jam shift (realtime enforcement berbasis
 * start_time/end_time, termasuk shift yang melewati tengah malam).
 */
class ShiftController extends Controller
{
    /**
     * Shift aktif tenant + info window jam operasional.
     * GET /api/shifts/current
     *
     * @param Request $request Request ber-autentikasi
     * @return JsonResponse { message, data: shift|null, within_window }
     */
    public function current(Request $request): JsonResponse
    {
        // Cek shift aktif milik tenant (bukan per-user), semua kasir share 1 shift
        $shift = Shift::where('status', 'open')
            ->latest('opened_at')
            ->first();

        if (!$shift) {
            return response()->json([
                'message' => 'Tidak ada shift yang sedang berjalan.',
                'data'    => null,
            ], 200);
        }

        // Cek apakah waktu sekarang masih dalam window shift
        $withinWindow = true;
        if ($shift->start_time && $shift->end_time) {
            $now   = now()->format('H:i:s');
            $start = $shift->start_time;
            $end   = $shift->end_time;

            // Handle shift yang melewati tengah malam (misal 22:00 - 06:00)
            if ($end < $start) {
                $withinWindow = $now >= $start || $now <= $end;
            } else {
                $withinWindow = $now >= $start && $now <= $end;
            }
        }

        $orderCount = Order::where('shift_id', $shift->id)->count();
        $totalSales = Order::where('shift_id', $shift->id)
            ->where('status', 'paid')
            ->sum('total');

        return response()->json([
            'message'        => 'Shift aktif ditemukan.',
            'data'           => $this->formatShift($shift, $orderCount, $totalSales),
            'within_window'  => $withinWindow,
        ], 200);
    }

    /**
     * Buka shift baru. Hanya boleh satu shift open per tenant (422 kalau
     * masih ada). Waktu simpan dengan format H:i:s.
     * POST /api/shifts/open
     *
     * @param Request $request Body: shift_name, start_time, end_time, opening_balance,
     *                          opening_note?, opening_denominations?
     * @return JsonResponse 201 / 422 masih ada shift aktif
     */
    public function open(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shift_name'            => ['required', 'string', 'max:50'],
            'start_time'            => ['required', 'date_format:H:i'],
            'end_time'              => ['required', 'date_format:H:i'],
            'opening_balance'       => ['required', 'numeric', 'min:0'],
            'opening_note'          => ['nullable', 'string', 'max:500'],
            'opening_denominations' => ['nullable', 'array'],
        ]);

        // Cek apakah tenant sudah punya shift aktif
        $active = Shift::where('status', 'open')->exists();
        if ($active) {
            return response()->json([
                'message' => 'Masih ada shift yang sedang berjalan. Tutup shift tersebut terlebih dahulu.',
            ], 422);
        }

        $shift = Shift::create([
            'tenant_id'             => $request->user()->tenant_id,
            'user_id'               => $request->user()->id,
            'shift_number'          => 1,
            'shift_name'            => $validated['shift_name'],
            'start_time'            => $validated['start_time'] . ':00',
            'end_time'              => $validated['end_time'] . ':00',
            'status'                => 'open',
            'opened_at'             => now(),
            'opening_balance'       => $validated['opening_balance'],
            'opening_note'          => $validated['opening_note'] ?? null,
            'opening_denominations' => $validated['opening_denominations'] ?? null,
        ]);

        return response()->json([
            'message' => "Shift {$validated['shift_name']} berhasil dibuka.",
            'data'    => $this->formatShift($shift),
        ], 201);
    }

    /**
     * Tutup shift: hitung expected balance & selisih kas.
     *
     * Rumus: expected = modal awal + penjualan tunai (settlement) − petty cash;
     * selisih = uang fisik (closing_balance) − expected (minus = kurang).
     * PATCH /api/shifts/{id}/close
     *
     * @param Request $request Body: closing_balance, closing_denominations?, petty_cash?,
     *                          petty_cash_note?, notes?, verified_by?
     * @param int     $id      ID shift
     * @return JsonResponse 200 / 404 / 422 sudah ditutup
     */
    public function close(Request $request, int $id): JsonResponse
    {
        $shift = Shift::find($id);

        if (!$shift) {
            return response()->json(['message' => 'Shift tidak ditemukan.'], 404);
        }

        if ($shift->status === 'closed') {
            return response()->json(['message' => 'Shift ini sudah ditutup.'], 422);
        }

        $validated = $request->validate([
            'closing_balance'       => ['required', 'numeric', 'min:0'],
            'closing_denominations' => ['nullable', 'array'],
            'petty_cash'            => ['nullable', 'numeric', 'min:0'],
            'petty_cash_note'       => ['nullable', 'string', 'max:500'],
            'notes'                 => ['nullable', 'string', 'max:500'],
            'verified_by'           => ['nullable', 'string', 'max:100'],
        ]);

        $paidOrders = Order::where('shift_id', $shift->id)
            ->where('status', 'paid')
            ->get();

        $cashTotal = Transaction::whereIn('order_id', $paidOrders->pluck('id'))
            ->where('payment_method', 'cash')
            ->where('status', 'settlement')
            ->sum('amount');

        $pettyCash = $validated['petty_cash'] ?? 0;

        // Uang tunai seharusnya = Modal Awal + Penjualan Tunai − Pengeluaran Kas Kecil
        $expectedBalance = $shift->opening_balance + $cashTotal - $pettyCash;
        // Selisih = uang fisik − uang seharusnya  (minus = kurang, plus = lebih)
        $difference = $validated['closing_balance'] - $expectedBalance;

        $shift->update([
            'status'                => 'closed',
            'closed_at'             => now(),
            'closing_balance'       => $validated['closing_balance'],
            'closing_denominations' => $validated['closing_denominations'] ?? null,
            'expected_balance'      => $expectedBalance,
            'difference'            => $difference,
            'petty_cash'            => $pettyCash,
            'petty_cash_note'       => $validated['petty_cash_note'] ?? null,
            'notes'                 => $validated['notes'] ?? null,
            'verified_by'           => $validated['verified_by'] ?? null,
        ]);

        return response()->json([
            'message' => "Shift {$shift->shift_name} berhasil ditutup.",
            'data'    => $this->formatShift($shift->fresh()),
        ], 200);
    }

    /**
     * Laporan detail shift: ringkasan order, sales summary (gross/tax/net),
     * void, breakdown pembayaran, kelompok tunai vs non-tunai, dan daftar
     * order paid. Eager load items.product/transaction/user → tanpa N+1.
     * GET /api/shifts/{id}/report
     *
     * @param Request $request Request ber-autentikasi
     * @param int     $id      ID shift
     * @return JsonResponse { message, data: { shift, summary, sales_summary, payment_groups, cash_summary, payment_breakdown, orders } }
     */
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

        // ----- RINGKASAN PENJUALAN -----
        // Catatan: proyek ini TIDAK punya fitur diskon, jadi "diskon" = 0.
        //   Penjualan Kotor (subtotal) + PPN 11% = Penjualan Bersih (total diterima).
        //   Void/Retur diwakili oleh order berstatus 'cancelled' (informasi saja).
        $grossSales = $paidOrders->sum('subtotal');
        $taxTotal   = $paidOrders->sum('tax');
        $netSales   = $paidOrders->sum('total');
        $voidAmount = $cancelledOrders->sum('total');

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

        // Kelompokkan pembayaran: Tunai vs Non-Tunai
        $cashSales    = (float) $cashTransactions->sum('amount');
        $nonCashSales = (float) $paymentBreakdown->where('method', '!=', 'cash')->sum('total');

        // Uang tunai seharusnya = Modal Awal + Penjualan Tunai − Pengeluaran Kas Kecil
        $pettyCash    = (float) ($shift->petty_cash ?? 0);
        $expectedCash = $shift->opening_balance + $cashSales - $pettyCash;

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
                'sales_summary' => [
                    'gross_sales' => (float) $grossSales,   // subtotal sebelum PPN
                    'tax'         => (float) $taxTotal,      // PPN 11%
                    'net_sales'   => (float) $netSales,      // total diterima (subtotal + PPN)
                    'void_count'  => $cancelledOrders->count(),
                    'void_amount' => (float) $voidAmount,    // nilai transaksi dibatalkan (info)
                ],
                'payment_groups' => [
                    'cash'     => $cashSales,
                    'non_cash' => $nonCashSales,
                ],
                'cash_summary' => [
                    'opening_balance'  => (float) $shift->opening_balance,
                    'cash_sales'       => $cashSales,
                    'cash_count'       => $cashTransactions->count(),
                    'petty_cash'       => $pettyCash,
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

    /**
     * Daftar shift (pagination 20, terbaru dulu) + agregat order/sales per shift.
     * Agregat dihitung via withCount/withSum (subselect join), bukan 2 query
     * per shift seperti sebelumnya (fix N+1).
     * GET /api/shifts
     *
     * @param Request $request Request ber-autentikasi
     * @return JsonResponse { message, data, meta pagination }
     */
    public function index(Request $request): JsonResponse
    {
        $shifts = Shift::with('user')
            ->withCount('orders as order_count')
            ->withSum(['orders as total_sales' => fn($q) => $q->where('status', 'paid')], 'total')
            ->latest('opened_at')
            ->paginate(20);

        // Format tiap shift memakai agregat yang sudah di-load di query di atas
        $shifts->getCollection()->transform(fn($shift) => $this->formatShift(
            $shift,
            (int) $shift->order_count,
            (float) ($shift->total_sales ?? 0)
        ));

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

    /**
     * Format shift untuk response (whitelist field). Waktu ditampilkan
     * HH:MM; relasi user dibaca hanya kalau sudah di-load.
     *
     * @param Shift $shift      Shift yang akan diformat
     * @param int   $orderCount Jumlah order (dari withCount atau hitungan manual)
     * @param float $totalSales Total penjualan paid (dari withSum atau hitungan manual)
     * @return array Data shift siap-JSON
     */
    private function formatShift(Shift $shift, int $orderCount = 0, float $totalSales = 0): array
    {
        return [
            'id'              => $shift->id,
            'shift_number'    => $shift->shift_number,
            'shift_name'      => $shift->shift_name,
            'start_time'      => $shift->start_time ? substr($shift->start_time, 0, 5) : null,
            'end_time'        => $shift->end_time   ? substr($shift->end_time, 0, 5)   : null,
            'status'          => $shift->status,
            'opened_at'       => $shift->opened_at->format('d M Y H:i'),
            'closed_at'       => $shift->closed_at?->format('d M Y H:i'),
            'opening_balance' => (float) $shift->opening_balance,
            'opening_note'    => $shift->opening_note,
            'opening_denominations' => $shift->opening_denominations,
            'closing_balance' => (float) ($shift->closing_balance ?? 0),
            'closing_denominations' => $shift->closing_denominations,
            'expected_balance' => (float) ($shift->expected_balance ?? 0),
            'difference'      => (float) ($shift->difference ?? 0),
            'petty_cash'      => (float) ($shift->petty_cash ?? 0),
            'petty_cash_note' => $shift->petty_cash_note,
            'notes'           => $shift->notes,
            'verified_by'     => $shift->verified_by,
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
