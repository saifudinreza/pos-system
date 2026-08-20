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
        // Cari tenant 'Maung Store' (slug: maung-store atau name berisi Maung)
        $maungTenant = Tenant::where('slug', 'maung-store')
            ->orWhere('name', 'LIKE', '%Maung%')
            ->first();

        if (! $maungTenant) {
            $maungTenant = Tenant::create([
                'name'        => 'Maung Store',
                'slug'        => 'maung-store',
                'description' => 'Toko Maung Store',
            ]);
        }

        // Hubungkan/pindahkan user nabila@gmail.com ke tenant Maung Store
        User::updateOrCreate(
            ['email' => 'nabila@gmail.com'],
            [
                'tenant_id' => $maungTenant->id,
                'name'      => 'Nabila',
                'password'  => Hash::make('nabila123'),
                'role'      => 'admin',
                'is_active' => true,
            ]
        );

        // 3. Hapus tenant 'Nabila Store' (slug: nabila-store) yang kosong jika ada
        Tenant::where('slug', 'nabila-store')
            ->where('id', '!=', $maungTenant->id)
            ->delete();
    }
}
