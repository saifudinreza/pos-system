<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Makanan',
            'Minuman',
            'Snack',
            'Rokok',
            'Kebutuhan Rumah',
        ];
        // ↑ List kategori — slug otomatis digenerate dari boot() di Model Category
        // Contoh: "Makanan" → slug "makanan", "Kebutuhan Rumah" → "kebutuhan-rumah"

        foreach ($categories as $name) {
            Category::create([
                'name' => $name,
                'is_active' => true,
            ]);
        }
    }
}
