<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * CustomerController, CRM ringan: daftar & detail pelanggan.
 *
 * Agregat (orders_count, total_spent, last_order_at) dihitung via withCount/
 * withSum/withMax → tanpa N+1. Isolasi tenant otomatis via TenantScope.
 */
class CustomerController extends Controller
{
    /**
     * Daftar pelanggan, dengan ringkasan jumlah order & total belanja.
     * GET /api/customers
     * Role: admin & developer
     *
     * @param Request $request Query: search? (nama atau nomor HP)
     * @return JsonResponse { message, data, meta: { total } }
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query()
            ->withCount(['orders' => function ($q) {
                $q->where('status', 'paid');
            }])
            ->withSum(['orders as total_spent' => function ($q) {
                $q->where('status', 'paid');
            }], 'total')
            ->withMax(['orders as last_order_at'], 'created_at');

        // ----- SEARCH (nama atau nomor HP) -----
        if ($request->filled('search')) {
            $keyword = $request->search;
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('phone', 'like', "%{$keyword}%");
            });
        }

        $query->orderByDesc('created_at');

        $customers = $query->get();

        return response()->json([
            'message' => 'Data pelanggan berhasil diambil.',
            'data'    => $customers->map(fn ($c) => $this->formatCustomer($c)),
            'meta'    => [
                'total' => $customers->count(),
            ],
        ], 200);
    }

    /**
     * Detail satu pelanggan + riwayat order terbaru.
     * GET /api/customers/{id}
     *
     * @param int $id ID pelanggan
     * @return JsonResponse 200 detail / 404
     */
    public function show(int $id): JsonResponse
    {
        $customer = Customer::withCount(['orders as orders_count'])
            ->withSum(['orders as total_spent' => function ($q) {
                $q->where('status', 'paid');
            }], 'total')
            ->with(['orders' => function ($q) {
                $q->orderByDesc('created_at')->take(20);
            }])
            ->find($id);

        if (! $customer) {
            return response()->json(['message' => 'Pelanggan tidak ditemukan.'], 404);
        }

        $orders = $customer->orders->map(fn ($o) => [
            'id'           => $o->id,
            'order_number' => $o->order_number,
            'status'       => $o->status,
            'total'        => (float) $o->total,
            'created_at'   => $o->created_at->format('d M Y H:i'),
        ]);

        return response()->json([
            'message' => 'Detail pelanggan berhasil diambil.',
            'data'    => [
                'id'         => $customer->id,
                'name'       => $customer->name,
                'phone'      => $customer->phone,
                'notes'      => $customer->notes,
                'created_at' => $customer->created_at->format('d M Y'),
                'summary'    => [
                    'orders_count' => $customer->orders_count ?? 0,
                    'total_spent'  => (float) ($customer->total_spent ?? 0),
                ],
                'orders' => $orders,
            ],
        ], 200);
    }

    /**
     * Format satu pelanggan untuk response daftar.
     * Semua agregat dibaca dari kolom hasil withCount/withSum/withMax
     * (fallback ?? 0 kalau tidak di-load).
     *
     * @param Customer $customer Pelanggan yang akan diformat
     * @return array Data pelanggan siap-JSON
     */
    private function formatCustomer(Customer $customer): array
    {
        return [
            'id'            => $customer->id,
            'name'          => $customer->name,
            'phone'         => $customer->phone,
            'notes'         => $customer->notes,
            'orders_count'  => $customer->orders_count ?? 0,
            'total_spent'   => (float) ($customer->total_spent ?? 0),
            'last_order_at' => $customer->last_order_at
                ? \Carbon\Carbon::parse($customer->last_order_at)->format('d M Y')
                : null,
            'created_at'    => $customer->created_at->format('d M Y'),
        ];
    }
}
