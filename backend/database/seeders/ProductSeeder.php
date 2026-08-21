<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'maung-store')
            ->orWhere('name', 'LIKE', '%Maung%')
            ->first()
            ?? Tenant::first();

        $tenantId = $tenant?->id;

        // Ambil ID kategori yang sudah dibuat di CategorySeeder
        $makanan  = Category::withoutGlobalScopes()->where('name', 'Makanan')->where('tenant_id', $tenantId)->first()?->id
            ?? Category::withoutGlobalScopes()->where('name', 'Makanan')->first()?->id;
        $minuman  = Category::withoutGlobalScopes()->where('name', 'Minuman')->where('tenant_id', $tenantId)->first()?->id
            ?? Category::withoutGlobalScopes()->where('name', 'Minuman')->first()?->id;
        $snack    = Category::withoutGlobalScopes()->where('name', 'Snack')->where('tenant_id', $tenantId)->first()?->id
            ?? Category::withoutGlobalScopes()->where('name', 'Snack')->first()?->id;
        $rokok    = Category::withoutGlobalScopes()->where('name', 'Rokok')->where('tenant_id', $tenantId)->first()?->id
            ?? Category::withoutGlobalScopes()->where('name', 'Rokok')->first()?->id;

        $products = [
            // ===== MAKANAN =====
            [
                'tenant_id'   => $tenantId,
                'category_id' => $makanan,
                'name'        => 'Indomie Goreng',
                'sku'         => 'MKN-001',
                'description' => 'Mie goreng instan paling laris',
                'price'       => 3500,
                'cost'        => 2800,
                'stock'       => 100,
                'stock_alert' => 20,
                'is_active'   => true,
            ],
            [
                'tenant_id'   => $tenantId,
                'category_id' => $makanan,
                'name'        => 'Indomie Kuah Ayam Bawang',
                'sku'         => 'MKN-002',
                'description' => 'Mie kuah instan gurih',
                'price'       => 3500,
                'cost'        => 2800,
                'stock'       => 80,
                'stock_alert' => 20,
                'is_active'   => true,
            ],
            [
                'tenant_id'   => $tenantId,
                'category_id' => $makanan,
                'name'        => 'Roti Tawar Sari Roti',
                'sku'         => 'MKN-003',
                'description' => 'Roti tawar lembut kemasan',
                'price'       => 15000,
                'cost'        => 12000,
                'stock'       => 30,
                'stock_alert' => 10,
                'is_active'   => true,
            ],

            // ===== MINUMAN =====
            [
                'tenant_id'   => $tenantId,
                'category_id' => $minuman,
                'name'        => 'Aqua 600ml',
                'sku'         => 'MNM-001',
                'description' => 'Air mineral botol 600ml',
                'price'       => 4000,
                'cost'        => 3000,
                'stock'       => 150,
                'stock_alert' => 30,
                'is_active'   => true,
            ],
            [
                'tenant_id'   => $tenantId,
                'category_id' => $minuman,
                'name'        => 'Teh Botol Sosro 450ml',
                'sku'         => 'MNM-002',
                'description' => 'Teh manis dalam botol',
                'price'       => 6000,
                'cost'        => 4500,
                'stock'       => 80,
                'stock_alert' => 20,
                'is_active'   => true,
            ],
            [
                'tenant_id'   => $tenantId,
                'category_id' => $minuman,
                'name'        => 'Kopi Good Day Mocacinno',
                'sku'         => 'MNM-003',
                'description' => 'Kopi sachet siap seduh',
                'price'       => 2500,
                'cost'        => 1800,
                'stock'       => 200,
                'stock_alert' => 50,
                'is_active'   => true,
            ],

            // ===== SNACK =====
            [
                'tenant_id'   => $tenantId,
                'category_id' => $snack,
                'name'        => 'Chitato Original 68g',
                'sku'         => 'SNK-001',
                'description' => 'Keripik kentang rasa original',
                'price'       => 10000,
                'cost'        => 8000,
                'stock'       => 60,
                'stock_alert' => 15,
                'is_active'   => true,
            ],
            [
                'tenant_id'   => $tenantId,
                'category_id' => $snack,
                'name'        => 'Oreo Original 133g',
                'sku'         => 'SNK-002',
                'description' => 'Biskuit sandwich coklat',
                'price'       => 8500,
                'cost'        => 6500,
                'stock'       => 50,
                'stock_alert' => 10,
                'is_active'   => true,
            ],

            // ===== ROKOK =====
            [
                'tenant_id'   => $tenantId,
                'category_id' => $rokok,
                'name'        => 'Sampoerna Mild 16',
                'sku'         => 'RKK-001',
                'description' => 'Rokok mild isi 16 batang',
                'price'       => 32000,
                'cost'        => 28000,
                'stock'       => 40,
                'stock_alert' => 10,
                'is_active'   => true,
            ],
            [
                'tenant_id'   => $tenantId,
                'category_id' => $rokok,
                'name'        => 'Gudang Garam Surya 12',
                'sku'         => 'RKK-002',
                'description' => 'Rokok kretek isi 12 batang',
                'price'       => 25000,
                'cost'        => 22000,
                'stock'       => 35,
                'stock_alert' => 10,
                'is_active'   => true,
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(
                [
                    'sku'       => $product['sku'],
                    'tenant_id' => $tenantId,
                ],
                $product
            );
        }
    }
}
