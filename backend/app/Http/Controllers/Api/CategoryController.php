<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * CategoryController — CRUD kategori produk per-tenant.
 *
 * Isolasi tenant otomatis via TenantScope (tidak ada WHERE tenant_id manual).
 * Read limit paket dipakai untuk FREE (15 kategori) — lihat Controller::categoryReadLimits().
 * Slug digenerate otomatis dari model (event creating), tidak perlu dikirim frontend.
 */
class CategoryController extends Controller
{
    /**
     * Daftar kategori + jumlah produk per kategori (withCount), dengan search
     * dan filter is_active. Paket FREE di-cap ke read limit kategori.
     *
     * @param Request $request Query: search?, is_active?
     * @return JsonResponse { message, data, meta: { plan, plan_limit, is_limited, total_in_tenant } }
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::withCount('products');

        // Developer melihat lintas tenant → eager load relasi tenant supaya
        // kolom "Tenant" bisa ditampilkan & disortir di frontend.
        if ($request->user()->role === 'developer') {
            $query->with('tenant');
        }

        // ----- FILTER TENANT (khusus developer) -----
        // Developer biasanya melihat semua tenant. Bila ingin fokus ke satu
        // tenant, kirim ?tenant_id=xxx — parameter ini DIABAIKAN untuk
        // non-developer (keamanan: mereka tetap hanya lihat tenant sendiri).
        if ($request->user()->role === 'developer' && $request->filled('tenant_id')) {
            $query->where('categories.tenant_id', $request->tenant_id);
        }

        // ----- SEARCH -----
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // ----- FILTER STATUS ------
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        // ----- SORTING -----
        // Default urut nama asc. Developer boleh sortir berdasarkan nama tenant
        // (via join tabel tenants); non-developer diabaikan untuk keamanan.
        $sortBy    = $request->query('sort_by', 'name');
        $sortOrder = $request->query('sort_order', 'asc');
        if ($sortBy === 'tenant' && $request->user()->role === 'developer') {
            $query->join('tenants', 'categories.tenant_id', '=', 'tenants.id')
                  ->orderBy('tenants.name', $sortOrder === 'asc' ? 'asc' : 'desc')
                  ->select('categories.*');
        } elseif (in_array($sortBy, ['name', 'created_at'])) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('name', 'asc');
        }

        // ----- PLAN-BASED READ LIMIT -----
        $plan      = $this->getEffectivePlan($request->user());
        $readLimit = $this->categoryReadLimits($plan);
        $isDeveloper = $request->user()->role === 'developer';
        $totalInTenant = (clone $query)->count();

        // Developer bebas melihat semua kategori tanpa cap read-limit
        $categories = ($readLimit !== null && ! $isDeveloper)
            ? $query->take($readLimit)->get()
            : $query->get();

        return response()->json([
            'message' => 'Data kategori berhasil diambil.',
            'data'    => $categories->map(fn($c) => $this->formatCategory($c)),
            'meta'    => [
                'plan'            => $plan,
                'plan_limit'      => $readLimit,
                'is_limited'      => $readLimit !== null && $totalInTenant > $readLimit,
                'total_in_tenant' => $totalInTenant,
            ],
        ], 200);
    }


    // =============================================================
    // SHOW — ambil satu kategori by ID beserta produknya
    // GET /api/categories/{id}
    // =============================================================
    /**
     * Detail satu kategori + preview 10 produk aktif di dalamnya
     * (produk di-eager load dengan limit 10 → bukan semua produk).
     *
     * @param int $id ID kategori
     * @return JsonResponse 200 detail / 404 tidak ditemukan
     */
    public function show(int $id): JsonResponse
    {
        $category = Category::withCount('products')
            ->with(['products' => function ($query) {
                $query->where('is_active', true)->take(10);
                // ↑ Ambil 10 produk aktif saja sebagai preview
                // Tidak perlu semua produk di response ini
            }])
            ->find($id);

        if (! $category) {
            return response()->json([
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Deatail kategori berhasil diambil.',
            'data' => [
                ...$this->formatCategory($category),
                // ↑ Spread operator — ambil semua field dari formatCategory()
                'products' => $category->products->map(fn($p) => [
                    'id'    => $p->id,
                    'name'  => $p->name,
                    'sku'   => $p->sku,
                    'price' => $p->price,
                    'stock' => $p->stock,
                ]),
                // ↑ Tambahkan list produk preview di response show
            ],
        ], 200);
    }


    // =============================================================
    // STORE — tambah kategori baru
    // POST /api/categories
    // Role: admin only
    // =============================================================
    /**
     * Tambah kategori baru. Gate paket: FREE cap 15 kategori (422 limit_reached).
     * Nama kategori harus unik dalam tenant yang sama.
     *
     * @param Request $request Body: { name, is_active? }
     * @return JsonResponse 201 / 422 limit paket
     */
    public function store(Request $request): JsonResponse
    {
        // ----- CEK LIMIT PAKET -----
        $plan  = $this->getEffectivePlan($request->user());
        $limit = $this->categoryReadLimits($plan);

        if ($limit !== null && Category::count() >= $limit) {
            return response()->json([
                'message' => "Paket " . strtoupper($plan) . " hanya bisa menyimpan {$limit} kategori. Upgrade untuk menambah lebih banyak.",
                'limit_reached' => true,
            ], 422);
        }

        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:255',
                Rule::unique('categories', 'name')->where('tenant_id', $request->user()->tenant_id),
            ],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = Category::create(array_merge($validated, [
            'tenant_id' => $request->user()->tenant_id,
        ]));
        // ↑ Slug otomatis digenerate dari boot() di Model Category
        // Tidak perlu kirim slug dari frontend

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan.',
            'data' => $this->formatCategory($category),
        ], 201);
    }


    // =============================================================
    // UPDATE — edit kategori
    // PUT /api/categories/{id}
    // Role: admin only
    // =============================================================
    /**
     * Edit kategori; slug otomatis di-generate ulang kalau nama berubah.
     * Unik-per-tenant dengan ignore id sendiri.
     *
     * @param Request $request Body: name?, is_active?
     * @param int     $id      ID kategori
     * @return JsonResponse 200 / 404
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json([
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name'      => ['sometimes', 'string', 'max:255',
                Rule::unique('categories', 'name')->where('tenant_id', $category->tenant_id)->ignore($id),
            ],
            'is_active' => ['nullable', 'boolean'],
        ]);

        // Update slug kalau nama berubah
        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
            // ↑ Generate ulang slug sesuai nama baru
        }

        $category->update($validated);

        return response()->json([
            'message' => 'Kategori berhasil diupdate.',
            'data' => $this->formatCategory($category->fresh()),
        ], 200);
    }


    // =============================================================
    // DESTROY — hapus kategori
    // DELETE /api/categories/{id}
    // Role: admin only
    // =============================================================
    /**
     * Hapus kategori. Kategori yang masih dipakai produk TIDAK boleh dihapus
     * (422 + products_count) — integritas relasi terjaga.
     *
     * @param int $id ID kategori
     * @return JsonResponse 200 / 404 / 422 masih punya produk
     */
    public function destroy(int $id): JsonResponse
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json([
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        // Cek apakah kategori masih punya produk
        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Kategori tidak bisa dihapus karena masih memiliki produk. Pindahkan atau hapus produknya dulu.',
                'products_count' => $category->products()->count(),
                // ↑ Kasih tau ada berapa produk yang masih pakai kategori ini
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus.',
        ], 200);
    }

    // =============================================================
    // HELPER — format data kategori untuk response
    // =============================================================
    /**
     * Format data kategori untuk response (whitelist field).
     * products_count fallback ke 0 kalau withCount tidak dipakai.
     *
     * @param Category $category Kategori yang akan diformat
     * @return array Data kategori siap-JSON
     */
    private function formatCategory(Category $category): array
    {
        return [
            'id'             => $category->id,
            'name'           => $category->name,
            'slug'           => $category->slug,
            'is_active'      => $category->is_active,
            'tenant'         => $category->relationLoaded('tenant') && $category->tenant ? [
                'id'   => $category->tenant->id,
                'name' => $category->tenant->name,
            ] : null,
            'products_count' => $category->products_count ?? 0,
            // ↑ ?? 0 = fallback ke 0 kalau withCount() tidak dipakai
            'created_at'     => $category->created_at->format('d M Y'),
        ];
    }
}
