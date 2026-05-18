<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::withCount('products');
        // ↑ withCount() = tambah kolom products_count di hasil query
        // Jadi bisa tau berapa produk di tiap kategori tanpa query tambahan
        // Contoh output: "products_count": 5

        // ----- SEARCH -----
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // ----- FILTER STATUS ------
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $categories = $query->orderBy('name', 'asc')->get();
        // ↑ get() tanpa paginate karena kategori biasanya sedikit
        // Diurutkan alphabetical supaya mudah dicari di dropdown frontend

        return response()->json([
            'message' => 'Data kategori berhasil diambil.',
            'data' => $categories->map(fn($c) => $this->formatCategory($c)),
        ], 200);
    }


    // =============================================================
    // SHOW — ambil satu kategori by ID beserta produknya
    // GET /api/categories/{id}
    // =============================================================
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
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories, name'],
            // ↑ unique:categories,name = nama kategori tidak boleh sama
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category = Category::create($validated);
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
    
    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json([
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate ([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                'unique:categories,name,' . $id,
                // ↑ Ignore ID kategori ini sendiri saat cek unique
            ],
            'is_active' => ['nullable', 'boolean'],
        ]);

        // Update slug kalau nama berubah
        if (isset($validated['name'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
            // ↑ Generate ulang slug sesuai nama baru
        }

        $category->update($validated);

        return respones()->json([
            'message' => 'Kategori berhasil diupdate.',
            'data' => $this->formatCategory($category->fresh()),
        ], 200);
    }


    // =============================================================
    // DESTROY — hapus kategori
    // DELETE /api/categories/{id}
    // Role: admin only
    // =============================================================
    public function destroy(int $id): JsonResponse
    {
        $category = Category::find($id);

        if(! $category) {
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
            'message' => 'Kategori berhasil dihapus,'.
        ], 200);
    }

    // =============================================================
    // HELPER — format data kategori untuk response
    // =============================================================
    private function formatCategory(Category $category): array
    {
        return [
            'id'             => $category->id,
            'name'           => $category->name,
            'slug'           => $category->slug,
            'is_active'      => $category->is_active,
            'products_count' => $category->products_count ?? 0,
            // ↑ ?? 0 = fallback ke 0 kalau withCount() tidak dipakai
            'created_at'     => $category->created_at->format('d M Y'),
        ];
    }
}
