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

        // 2. Akun Nabila (Admin Toko Nabila Store)
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'nabila-store'],
            [
                'name'        => 'Nabila Store',
                'description' => 'Toko Nabila Store',
            ]
        );

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
