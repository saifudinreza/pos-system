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
define('PRODUCT_DISK', env('R2_ACCESS_KEY_ID') ? 'r2' : 'public');

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
        // ↑ with('category') = eager loading
        // Artinya data kategori langsung ikut diambil dalam 1 query
        // Tanpa ini = N+1 problem (query kategori diulang tiap produk)

        // ----- SEARCH -----
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('sku', 'like', '%' . $request->search . '%');
            // ↑ Cari berdasarkan nama atau SKU
            // filled() = cek apakah parameter ada DAN tidak kosong
        }

        // ----- FILTER KATEGORI -----
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // ----- FILTER STATUS -----
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
            // ↑ filter_var() convert string "true"/"false" ke boolean
            // Karena query string selalu string, bukan boolean
        }

        // ----- FILTER STOK MENIPIS -----
        if ($request->filled('low_stock')) {
            $query->whereColumn('stock', '<=', 'stock_alert');
            // ↑ Ambil produk yang stoknya sudah di bawah atau sama dengan stock_alert
            // Dipakai AI untuk prediksi restok
        }

        // ----- SORTING -----
        $sortBy = $request->get('sort_by', 'created_at');
        // ↑ Default sort by created_at
        $sortOrder = $request->get('sort_order', 'desc');
        // ↑ Default descending (terbaru dulu)

        $allowedSorts = ['name', 'price', 'stock', 'created_at'];
        // ↑ Whitelist kolom yang boleh di-sort
        // Mencegah user sort by kolom sembarangan (security)

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        // ----- PAGINATION -----
        $perPage = min($request->get('per_page', 10), 100);
        // ↑ Default 10 per halaman, maksimal 100
        // min() mencegah user minta 99999 data sekaligus

        $products = $query->paginate($perPage);
        // ↑ paginate() otomatis hitung total, halaman sekarang, dll

        return response()->json([
            'message' => 'Data produk berhasil diambil.',
            'data'    => $products->map(fn($p) => $this->formatProduct($p)),
            // ↑ map() = loop semua produk dan format satu-satu
            'meta'    => [
                'current_page' => $products->currentPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
                'last_page'    => $products->lastPage(),
                // ↑ Info pagination untuk frontend (buat tombol next/prev)
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
        $plan   = $request->user()->subscription_plan ?? 'free';
        $limits = ['free' => 5, 'pro' => 30, 'enterprise' => null];
        $limit  = $limits[$plan] ?? 5;

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
                ? Storage::disk(PRODUCT_DISK)->url($product->image)
                : null,
            // ↑ Pakai Storage::url() agar URL diambil dari disk yang aktif:
            // - R2: URL publik Cloudflare (https://pub-xxx.r2.dev/products/file.jpg)
            // - public: URL lokal (http://localhost:8000/storage/products/file.jpg)
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
