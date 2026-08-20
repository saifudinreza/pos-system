<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Developer (sistem, tanpa tenant)
        User::updateOrCreate(
            ['email' => 'donojomi@gmail.com'],
            [
                'tenant_id'  => null,
                'name'       => 'Saifudin Reza',
                'password'   => Hash::make('developer123'),
                'role'       => 'developer',
                'phone'      => null,
                'is_active'  => true,
            ]
        );

        // 2. Akun Nabila (Admin Toko Maung Store)
        // Note: Data 20 produk + 6 kategori Nabila ada di tenant 'maung-store' (Tenant ID 2 di production).
        $tenant = Tenant::where('slug', 'maung-store')
            ->orWhere('name', 'LIKE', '%Maung%')
            ->orWhere('slug', 'nabila-store')
            ->first()
            ?? Tenant::create([
                'name'        => 'Maung Store',
                'slug'        => 'maung-store',
                'description' => 'Toko Maung Store',
            ]);

        User::updateOrCreate(
            ['email' => 'nabila@gmail.com'],
            [
                'tenant_id' => $tenant->id,
                'name'      => 'Nabila',
                'password'  => Hash::make('nabila123'),
                'role'      => 'admin',
                'is_active' => true,
            ]
        );
    }
}
