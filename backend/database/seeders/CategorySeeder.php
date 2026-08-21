<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cari tenant Maung Store (atau tenant pertama)
        $tenant = Tenant::where('slug', 'maung-store')
            ->orWhere('name', 'LIKE', '%Maung%')
            ->first()
            ?? Tenant::first();

        $tenantId = $tenant?->id;

        $categories = [
            'Makanan',
            'Minuman',
            'Snack',
            'Rokok',
            'Kebutuhan Rumah',
        ];

        foreach ($categories as $name) {
            Category::updateOrCreate(
                [
                    'name'      => $name,
                    'tenant_id' => $tenantId,
                ],
                [
                    'is_active' => true,
                ]
            );
        }
    }
}
