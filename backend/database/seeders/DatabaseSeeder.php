<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            // ↑ URUTAN INI PENTING!
            // User dulu   → karena tidak ada dependency
            // Category    → karena Product butuh category_id
            // Product     → paling terakhir karena butuh category
        ]);
    }
}
