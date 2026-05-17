<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        // ===== ADMIN =====
        User::create([
            'name' => 'Admin POS',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('admin123'),
            // ↑ Hash::make() karena di model kita pakai cast 'hashed'
            // tapi untuk seeder lebih aman eksplisit pakai Hash::make()
            'role' => 'admin',
            'phone' => '081234567890',
            'is_active' => true,
        ]);

        // =====KASIR =====
        User::create([
            'name' => 'Kasir 1',
            'email' => 'Kasir1@gmail.com',
            'password' => Hash::make('kasir123'),
            'role'      => 'kasir',
            'phone'     => '081234567891',
            'is_active' => true,
        ]);

        // ===== USER / CUSTOMER =====
        User::create([
            'name' => 'Customer 1',
            'email' => 'customer@gmail.com',
            'password' => Hash::make('customer123'),
            'role'      => 'user',
            'phone'     => '081234567892',
            'is_active' => true,
        ]);
    }
}
