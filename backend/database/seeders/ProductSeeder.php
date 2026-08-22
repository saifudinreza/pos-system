<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class ProductSeeder extends Seeder
{
    /**
     * Pulihkan produk dari gambar asli di storage/app/public/products.
     *
     * Data produk unggahan asli (nama/ harga/ SKU) hilang dari DB, namun
     * file gambarnya masih utuh. Seeder ini membangun ulang entri produk
     * yang menunjuk ke masing-masing gambar tersebut supaya tidak ada
     * gambar yang terbuang. Detail (nama/ harga/ stok) berupa placeholder
     * yang bisa diedit lewat UI nanti.
     */
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'maung-store')
            ->orWhere('name', 'LIKE', '%Maung%')
            ->first()
            ?? Tenant::first();

        $tenantId = $tenant?->id;

        // Kategori yang tersedia (dibuat di CategorySeeder).
        $categories = Category::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->orderBy('id')
            ->get();

        if ($categories->isEmpty()) {
            $this->command->warn('Kategori belum ada — jalankan CategorySeeder dulu.');
            return;
        }
        $categoryIds = $categories->pluck('id')->all();

        // Hapus produk placeholder dari seeder lama (tanpa gambar, pakai SKU
        // standar) agar tidak dobel dengan produk hasil pemulihan.
        $seederPrefixes = ['MKN-', 'MNM-', 'SNK-', 'RKK-'];
        Product::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereNotNull('sku')
            ->where(function ($q) use ($seederPrefixes) {
                foreach ($seederPrefixes as $p) {
                    $q->orWhere('sku', 'LIKE', $p . '%');
                }
            })
            ->delete();

        // Baca semua gambar produk yang masih ada di storage.
        $disk = Storage::disk('public');
        $imageFiles = collect($disk->files('products'))
            ->filter(fn ($f) => in_array(strtolower(pathinfo($f, PATHINFO_EXTENSION)), [
                'png', 'jpg', 'jpeg', 'webp', 'gif',
            ]))
            ->values();

        if ($imageFiles->isEmpty()) {
            $this->command->warn('Tidak ada gambar di storage/app/public/products — tidak ada yang dipulihkan.');
            return;
        }

        $created = 0;
        foreach ($imageFiles as $i => $path) {
            $sku = 'IMG-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT);
            $categoryId = $categoryIds[$i % count($categoryIds)];

            Product::updateOrCreate(
                [
                    'sku'       => $sku,
                    'tenant_id' => $tenantId,
                ],
                [
                    'tenant_id'   => $tenantId,
                    'category_id' => $categoryId,
                    'name'        => 'Produk ' . ($i + 1),
                    'description' => 'Produk hasil pemulihan dari gambar.',
                    'price'       => 0,
                    'cost'        => 0,
                    'stock'       => 0,
                    'stock_alert' => 0,
                    'image'       => $path,
                    'is_active'   => true,
                ]
            );
            $created++;
        }

        $this->command->info("Pemulihan selesai: {$created} produk dibuat dari gambar di storage.");
    }
}
