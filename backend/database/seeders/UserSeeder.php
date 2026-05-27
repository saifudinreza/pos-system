<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Hanya satu akun: developer (sistem, tanpa tenant)
        // Password: developer123
        User::create([
            'tenant_id'  => null,
            'name'       => 'Saifudin Reza',
            'email'      => 'donojomi@gmail.com',
            'password'   => Hash::make('developer123'),
            'role'       => 'developer',
            'phone'      => null,
            'is_active'  => true,
        ]);
    }
}
