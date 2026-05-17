<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil ID kategori yang sudah dibuat di CategorySeeder
        // Pastikan CategorySeeder dijalankan DULU sebelum ini
        $makanan  = Category::where('name', 'Makanan')->first()->id;
        $minuman  = Category::where('name', 'Minuman')->first()->id;
        $snack    = Category::where('name', 'Snack')->first()->id;
        $rokok    = Category::where('name', 'Rokok')->first()->id;

        $products = [
            // ===== MAKANAN =====
            [
                'category_id' => $makanan,
                'name'        => 'Indomie Goreng',
                'sku'         => 'MKN-001',
                'description' => 'Mie goreng instan paling laris',
                'price'       => 3500,
                'stock'       => 100,
                'stock_alert' => 20,
                // ↑ Alert restok kalau stok sudah di bawah 20
                'is_active'   => true,
            ],
            [
                'category_id' => $makanan,
                'name'        => 'Indomie Kuah',
                'sku'         => 'MKN-002',
                'description' => 'Mie kuah instan',
                'price'       => 3500,
                'stock'       => 80,
                'stock_alert' => 20,
                'is_active'   => true,
            ],
            [
                'category_id' => $makanan,
                'name'        => 'Roti Tawar Sari Roti',
                'sku'         => 'MKN-003',
                'description' => 'Roti tawar kemasan',
                'price'       => 15000,
                'stock'       => 30,
                'stock_alert' => 10,
                'is_active'   => true,
            ],

            // ===== MINUMAN =====
            [
                'category_id' => $minuman,
                'name'        => 'Aqua 600ml',
                'sku'         => 'MNM-001',
                'description' => 'Air mineral botol 600ml',
                'price'       => 4000,
                'stock'       => 150,
                'stock_alert' => 30,
                'is_active'   => true,
            ],
            [
                'category_id' => $minuman,
                'name'        => 'Teh Botol Sosro',
                'sku'         => 'MNM-002',
                'description' => 'Teh manis dalam botol',
                'price'       => 6000,
                'stock'       => 80,
                'stock_alert' => 20,
                'is_active'   => true,
            ],
            [
                'category_id' => $minuman,
                'name'        => 'Kopi Good Day',
                'sku'         => 'MNM-003',
                'description' => 'Kopi sachet siap seduh',
                'price'       => 2500,
                'stock'       => 200,
                'stock_alert' => 50,
                'is_active'   => true,
            ],

            // ===== SNACK =====
            [
                'category_id' => $snack,
                'name'        => 'Chitato Original',
                'sku'         => 'SNK-001',
                'description' => 'Keripik kentang rasa original',
                'price'       => 10000,
                'stock'       => 60,
                'stock_alert' => 15,
                'is_active'   => true,
            ],
            [
                'category_id' => $snack,
                'name'        => 'Oreo Original',
                'sku'         => 'SNK-002',
                'description' => 'Biskuit sandwich coklat',
                'price'       => 8500,
                'stock'       => 50,
                'stock_alert' => 10,
                'is_active'   => true,
            ],

            // ===== ROKOK =====
            [
                'category_id' => $rokok,
                'name'        => 'Sampoerna Mild 16',
                'sku'         => 'RKK-001',
                'description' => 'Rokok mild isi 16 batang',
                'price'       => 28000,
                'stock'       => 40,
                'stock_alert' => 10,
                'is_active'   => true,
            ],
            [
                'category_id' => $rokok,
                'name'        => 'Gudang Garam Surya 12',
                'sku'         => 'RKK-002',
                'description' => 'Rokok kretek isi 12 batang',
                'price'       => 23000,
                'stock'       => 35,
                'stock_alert' => 10,
                'is_active'   => true,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
