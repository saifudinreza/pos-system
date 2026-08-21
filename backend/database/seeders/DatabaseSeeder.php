<?php

namespace Database\Seeders;

use App\Console\Commands\RepairNabilaTenant;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
        ]);

        // Konsolidasi akhir: pastikan seluruh produk & kategori milik tenant
        // Maung Store (akun nabila) — memperbaiki data yatim akibat riwayat
        // pembuatan/penghapusan tenant sebelumnya. Idempoten & aman diulang.
        $this->call(RepairNabilaTenant::class);
    }
}
