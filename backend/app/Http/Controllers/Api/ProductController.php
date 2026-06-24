<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

// Disk yang dipakai untuk upload gambar produk.
// Kalau R2 dikonfigurasi → pakai R2 (persistent, cloud).
// Kalau tidak → fallback ke 'public' (local, hilang saat redeploy).
define('PRODUCT_DISK', !empty(config('filesystems.disks.r2.key')) ? 'r2' : 'public');

class ProductController extends Controller
{
    // =============================================================
    // INDEX — ambil semua produk dengan filter, search, pagination
    // GET /api/products
    // GET /api/products?search=indomie
    // GET /api/products?category_id=1
    // GET /api/products?is_active=true
    // GET /api/products?page=1&per_page=10
    // =============================================================
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        // ----- SEARCH -----
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('sku',  'like', '%' . $request->search . '%');
            });
        }

        // ----- FILTER KATEGORI -----
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // ----- FILTER STATUS -----
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        // ----- FILTER STOK MENIPIS -----
        if ($request->filled('low_stock')) {
            $query->whereColumn('stock', '<=', 'stock_alert');
        }

        // ----- SORTING -----
        $sortBy    = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');
        $allowedSorts = ['name', 'price', 'stock', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        // ----- PLAN-BASED READ LIMIT -----
        $plan       = $this->getEffectivePlan($request->user());
        $readLimit  = $this->productReadLimits($plan);
        $totalInTenant = (clone $query)->count();

        if ($readLimit !== null) {
            // Hard cap: return only the first $readLimit products
            $items = $query->take($readLimit)->get();
            return response()->json([
                'message' => 'Data produk berhasil diambil.',
                'data'    => $items->map(fn($p) => $this->formatProduct($p)),
                'meta'    => [
                    'current_page'    => 1,
                    'per_page'        => $readLimit,
                    'total'           => $items->count(),
                    'last_page'       => 1,
                    'plan'            => $plan,
                    'plan_limit'      => $readLimit,
                    'is_limited'      => $totalInTenant > $readLimit,
                    'total_in_tenant' => $totalInTenant,
                ],
            ], 200);
        }

        // Enterprise / unlimited: normal pagination
        $perPage  = min((int) $request->query('per_page', 10), 100);
        $products = $query->paginate($perPage);
        return response()->json([
            'message' => 'Data produk berhasil diambil.',
            'data'    => $products->map(fn($p) => $this->formatProduct($p)),
            'meta'    => [
                'current_page'    => $products->currentPage(),
                'per_page'        => $products->perPage(),
                'total'           => $products->total(),
                'last_page'       => $products->lastPage(),
                'plan'            => $plan,
                'plan_limit'      => null,
                'is_limited'      => false,
                'total_in_tenant' => $totalInTenant,
            ],
        ], 200);
    }

    // =============================================================
    // SHOW — ambil satu produk by ID
    // GET /api/products/{id}
    // =============================================================
    public function show(int $id): JsonResponse
    {
        $product = Product::with('category')->find($id);
        // ↑ find() return null kalau tidak ketemu (tidak throw exception)

        if (! $product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'message' => 'Detail produk berhasil diambil.',
            'data' => $this->formatProduct($product),
        ], 200);
    }

    // =============================================================
    // STORE — tambah produk baru
    // POST /api/products
    // Role: admin only
    // =============================================================
    public function store(Request $request): JsonResponse
    {
        // ----- CEK LIMIT PAKET -----
        $plan  = $this->getEffectivePlan($request->user());
        $limit = $this->productReadLimits($plan);

        if ($limit !== null && Product::count() >= $limit) {
            return response()->json([
                'message' => "Paket " . strtoupper($plan) . " hanya bisa menyimpan {$limit} produk. Upgrade untuk menambah lebih banyak.",
                'limit_reached' => true,
            ], 422);
        }

        $validated = $request->validate([
            'category_id'  => ['required', 'exists:categories,id'],
            // ↑ exists:categories,id = cek apakah category_id ada di tabel categories
            'name'         => ['required', 'string', 'max:255'],
            'sku'          => ['required', 'string', \Illuminate\Validation\Rule::unique('products', 'sku')->where('tenant_id', $request->user()->tenant_id)],
            'description'  => ['nullable', 'string'],
            'price'        => ['required', 'numeric', 'min:0'],
            'stock'        => ['required', 'integer', 'min:0'],
            'stock_alert'  => ['nullable', 'integer', 'min:0'],
            'image'        => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            // ↑ max:2048 = maksimal 2MB
            'is_active'    => ['nullable', 'boolean'],
        ]);

        // ----- HANDLE UPLOAD GAMBAR -----
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', PRODUCT_DISK);
            $validated['image'] = $path;
        }

        $product = Product::create(array_merge($validated, [
            'tenant_id' => $request->user()->tenant_id,
        ]));

        // Hapus cache list produk karena ada produk baru
        Cache::forget('products_all');
        // ↑ Kalau kita pakai caching di index, harus dihapus
        // supaya data yang tampil selalu fresh setelah ada perubahan

        return response()->json([
            'message' => 'Produk berhasil ditambahkan.',
            'data'    => $this->formatProduct($product->load('category')),
        ], 201);
    }

    // =============================================================
    // UPDATE — edit produk
    // PUT /api/products/{id}
    // Role: admin only
    // =============================================================
    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'category_id'  => ['sometimes', 'exists:categories,id'],
            // ↑ 'sometimes' = validasi hanya dijalankan kalau field ini dikirim
            // Jadi bisa update sebagian field saja
            'name'         => ['sometimes', 'string', 'max:255'],
            'sku'          => ['sometimes', 'string', \Illuminate\Validation\Rule::unique('products', 'sku')->where('tenant_id', $product->tenant_id)->ignore($id)],
            'description'  => ['nullable', 'string'],
            'price'        => ['sometimes', 'numeric', 'min:0'],
            'stock'        => ['sometimes', 'integer', 'min:0'],
            'stock_alert'  => ['nullable', 'integer', 'min:0'],
            'image'        => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active'    => ['nullable', 'boolean'],
        ]);

        // ----- HANDLE UPLOAD GAMBAR BARU -----
        if ($request->hasFile('image')) {
            // hapus gambar lama kalau ada
            if ($product->image) {
                Storage::disk(PRODUCT_DISK)->delete($product->image);
                // ↑ Hapus file lama dari storage supaya tidak numpuk
            }
            $validated['image'] = $request->file('image')->store('products', PRODUCT_DISK);
        }

        $product->update($validated);

        Cache::forget('products_all');

        return response()->json([
            'message' => 'Produk berhasil diupdate.',
            'data' => $this->formatProduct($product->fresh()->load('category')),
            // ↑ fresh() = reload data dari DB setelah update
            // Supaya response berisi data terbaru bukan data lama
        ], 200);
    }

    // =============================================================
    // DESTROY — hapus produk
    // DELETE /api/products/{id}
    // Role: admin only
    // =============================================================
    public function destroy(int $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        // Cek apakah produk pernah ada di order
        if ($product->orderItems()->exists()) {
            return response()->json([
                'message' => 'Produk tidak bisa dihapus karena sudah pernah ada di transaksi. Nonaktifkan saja.',
            ], 422);
            // ↑ Best practice: produk yang pernah ditransaksikan
            // jangan dihapus supaya histori laporan tidak rusak
            // Sarankan admin untuk nonaktifkan saja
        }

        // Hapus gambar kalau ada
        if ($product->image) {
            Storage::disk(PRODUCT_DISK)->delete($product->image);
        }

        $product->delete();

        Cache::forget('products_all');

        return response()->json([
            'message' => 'Produk berhasil dihapus.',
        ], 200);
    }

    // =============================================================
    // HELPER — format data produk untuk response
    // =============================================================
    private function formatProduct(Product $product): array
    {
        return [
            'id'          => $product->id,
            'name'        => $product->name,
            'sku'         => $product->sku,
            'description' => $product->description,
            'price'       => $product->price,
            'stock'       => $product->stock,
            'stock_alert' => $product->stock_alert,
            'is_low_stock' => $product->isLowStock(),
            // ↑ Helper dari Model — true kalau stok sudah mepet
            'is_active'   => $product->is_active,
            'image_url'   => $product->image
                ? url('/api/media/' . $product->image)
                : null,
            'category'    => $product->relationLoaded('category') ? [
                'id'   => $product->category->id,
                'name' => $product->category->name,
            ] : null,
            // ↑ relationLoaded() = cek apakah relasi sudah di-load
            // Mencegah error kalau category tidak di-eager load
            'created_at'  => $product->created_at->format('d M Y'),
        ];
    }
}
