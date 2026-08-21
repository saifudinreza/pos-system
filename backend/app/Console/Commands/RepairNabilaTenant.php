<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * RepairNabilaTenant — perintah pemulihan data satu kali (idempoten, aman diulang).
 *
 * Masalah yang diperbaiki:
 *   Produk & kategori yang di-upload lewat UI oleh nabila@gmail.com tertinggal
 *   di tenant_id lama yang tidak lagi cocok dengan tenant_id user-nya. Karena
 *   TenantScope menyembunyikan seluruh row beda-tenant, kategori & produk (beserta
 *   gambar R2-nya) tidak muncul di UI padahal masih ada di DB/R2.
 *
 * Yang dilakukan:
 *   1. Cari user nabila@gmail.com, lalu tenant tujuannya (Maung Store).
 *   2. Pindahkan SELURUH produk & kategori di DB ke tenant tersebut
 *      (tanpa global scope, agar row yatim ikut kepindah).
 *   3. Petakan ulang product.category_id ke kategori se-nama di tenant yang sama
 *      supaya relasi category ke-load benar di bawah TenantScope.
 *
 * Perintah ini tidak menghapus apa pun dan tidak mengubah kolom image, sehingga
 * gambar di R2 tetap utuh.
 */
class RepairNabilaTenant extends Command
{
    protected $signature = 'kasirai:repair-nabila {--email=nabila@gmail.com}';
    protected $description = 'Konsolidasi produk & kategori ke tenant akun Nabila (Maung Store).';

    public function handle(): int
    {
        $email = $this->option('email');

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->warn("User {$email} tidak ditemukan — tidak ada yang diperbaiki.");
            return self::SUCCESS;
        }

        // Tentukan tenant tujuan: pakai tenant user, atau cari Maung Store.
        $targetTenant = $user->tenant_id
            ? Tenant::withoutGlobalScopes()->find($user->tenant_id)
            : null;

        if (! $targetTenant) {
            $targetTenant = Tenant::withoutGlobalScopes()
                ->where('slug', 'maung-store')
                ->orWhere('name', 'LIKE', '%Maung%')
                ->first();
        }

        if (! $targetTenant) {
            $this->warn('Tenant Maung Store tidak ditemukan — jalankan seeder dulu.');
            return self::SUCCESS;
        }

        // Pastikan user menunjuk ke tenant tujuan.
        if ($user->tenant_id !== $targetTenant->id) {
            $user->update(['tenant_id' => $targetTenant->id]);
            $this->info("User {$email} dipindahkan ke tenant #{$targetTenant->id} ({$targetTenant->name}).");
        }

        // 1 & 2: pindahkan produk & kategori yang "yatim" (milik tenant yang
        //         tidak punya SATU PUN user terkait) ke tenant tujuan.
        //         Pembatasan ini penting: kita TIDAK memindahkan data toko lain
        //         yang sah (tenant dengan user sendiri tetap di tempatnya), sehingga
        //         perintah ini aman dipakai di database multi-tenant production.
        $tenantIdsWithUsers = User::whereNotNull('tenant_id')
            ->distinct()
            ->pluck('tenant_id')
            ->push($targetTenant->id) // target selalu dipertahankan
            ->unique()
            ->all();

        $productsMoved = Product::withoutGlobalScopes()
            ->whereNotIn('tenant_id', $tenantIdsWithUsers)
            ->update(['tenant_id' => $targetTenant->id]);

        $categoriesMoved = Category::withoutGlobalScopes()
            ->whereNotIn('tenant_id', $tenantIdsWithUsers)
            ->update(['tenant_id' => $targetTenant->id]);

        $this->info("Produk dipindahkan: {$productsMoved} | Kategori dipindahkan: {$categoriesMoved}");

        // 3: petakan ulang category_id produk ke kategori se-nama di tenant tujuan,
        //    hindari product.category_id menunjuk kategori di tenant lain.
        $remapped = 0;
        $orphanCat = 0;
        Product::withoutGlobalScopes()
            ->where('tenant_id', $targetTenant->id)
            ->chunkById(200, function ($products) use ($targetTenant, &$remapped, &$orphanCat) {
                foreach ($products as $product) {
                    if (! $product->category_id) {
                        continue;
                    }
                    $current = Category::withoutGlobalScopes()
                        ->where('id', $product->category_id)
                        ->first();

                    // Kalau kategori masih ada & sudah di tenant tujuan → aman.
                    if ($current && $current->tenant_id === $targetTenant->id) {
                        continue;
                    }

                    // Cari kategori pengganti se-nama di tenant tujuan.
                    $replacement = Category::withoutGlobalScopes()
                        ->where('tenant_id', $targetTenant->id)
                        ->where('name', $current?->name)
                        ->first();

                    if ($replacement) {
                        $product->update(['category_id' => $replacement->id]);
                        $remapped++;
                    } else {
                        // Tidak ada kategori se-nama → biarkan null (produk tetap tampil
                        // tanpa kategori) agar tidak rusak relasi.
                        $product->update(['category_id' => null]);
                        $orphanCat++;
                    }
                }
            });

        $totalProducts = Product::withoutGlobalScopes()->where('tenant_id', $targetTenant->id)->count();
        $totalCategories = Category::withoutGlobalScopes()->where('tenant_id', $targetTenant->id)->count();

        $this->info("category_id dipetakan ulang: {$remapped} | dilepas (no match): {$orphanCat}");
        $this->info("Hasil: {$totalProducts} produk & {$totalCategories} kategori di tenant {$targetTenant->name} (#{$targetTenant->id}).");

        return self::SUCCESS;
    }
}
