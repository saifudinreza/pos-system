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
     * gambar yang terbuang.
     *
     * Nama produk diambil dari nama file gambar (tanpa ekstensi) supaya
     * cocok dengan isinya, mis. "matcha-latte.png" → "Matcha Latte",
     * "Es Teh Manis.jpg" → "Es Teh Manis". Cukup ganti nama file gambarnya
     * lalu jalankan ulang seeder ini untuk memperbarui nama & gambar.
     *
     * Gambar di-upload ke disk produk aktif (PRODUCT_DISK: R2 di production,
     * public di lokal) agar URL proxy /api/media/... benar-benar terresolve
     * dan tidak 404.
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
            $this->command->warn('Kategori belum ada, jalankan CategorySeeder dulu.');
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

        // Baca semua gambar produk yang masih ada di storage lokal (public).
        $sourceDisk = Storage::disk('public');
        $imageFiles = collect($sourceDisk->files('products'))
            ->filter(fn ($f) => in_array(strtolower(pathinfo($f, PATHINFO_EXTENSION)), [
                'png', 'jpg', 'jpeg', 'webp', 'gif',
            ]))
            ->values();

        if ($imageFiles->isEmpty()) {
            $this->command->warn('Tidak ada gambar di storage/app/public/products, tidak ada yang dipulihkan.');
            return;
        }

        // Disk tujuan = disk produk aktif (sama dengan konstanta PRODUCT_DISK
        // di ProductController). Jika R2 terkonfigurasi, unggah ke R2 supaya
        // proxy /api/media/... menemukan file tersebut.
        $targetDisk = !empty(config('filesystems.disks.r2.key')) ? 'r2' : 'public';
        $target = Storage::disk($targetDisk);

        $created = 0;
        foreach ($imageFiles as $i => $path) {
            $sku = 'IMG-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT);
            $categoryId = $categoryIds[$i % count($categoryIds)];

            // Pastikan file ada di disk tujuan (upload dari sumber lokal).
            if (! $target->exists($path)) {
                $target->put($path, $sourceDisk->get($path));
            }

            $name = $this->nameFromFilename($path);

            Product::updateOrCreate(
                [
                    'sku'       => $sku,
                    'tenant_id' => $tenantId,
                ],
                [
                    'tenant_id'   => $tenantId,
                    'category_id' => $categoryId,
                    'name'        => $name,
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

    /**
     * Ubah nama file gambar jadi nama produk yang mudah dibaca.
     *
     * "matcha-latte" → "Matcha Latte"
     * "es_teh_manis" → "Es Teh Manis"
     * "Matcha Latte" → "Matcha Latte"
     */
    private function nameFromFilename(string $path): string
    {
        $base = pathinfo($path, PATHINFO_FILENAME);
        $base = preg_replace('/[-_]+/', ' ', $base);
        $base = trim(preg_replace('/\s+/', ' ', $base));

        // Kapitalkan setiap kata, kecuali kata hubung umum biar natural.
        $lowerWords = ['dan', 'di', 'ke', 'dengan', 'atau'];
        $words = explode(' ', $base);
        $words = array_map(function ($w, $idx) use ($lowerWords) {
            if ($idx > 0 && in_array(strtolower($w), $lowerWords, true)) {
                return strtolower($w);
            }
            return ucfirst(strtolower($w));
        }, $words, array_keys($words));

        $name = implode(' ', $words);

        return $name === '' ? 'Produk Tanpa Nama' : $name;
    }
}
