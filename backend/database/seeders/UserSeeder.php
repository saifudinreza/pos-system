<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
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
        // Cari tenant Maung Store atau buat baru
        $maungTenant = Tenant::where('slug', 'maung-store')
            ->orWhere('name', 'LIKE', '%Maung%')
            ->first()
            ?? Tenant::find(2)
            ?? Tenant::first();

        if (! $maungTenant) {
            $maungTenant = Tenant::create([
                'name'        => 'Maung Store',
                'slug'        => 'maung-store',
                'description' => 'Toko Maung Store',
            ]);
        } else {
            $maungTenant->update([
                'name' => 'Maung Store',
                'slug' => 'maung-store',
            ]);
        }

        // Hubungkan/pindahkan user nabila@gmail.com ke tenant Maung Store ini
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

        // 3. Konsolidasikan SEMUA produk dan kategori di database ke tenant Maung Store ini
        //    (memastikan tidak ada data produk/kategori tersisa di tenant_id lama/lain)
        Product::withoutGlobalScopes()->update(['tenant_id' => $maungTenant->id]);
        Category::withoutGlobalScopes()->update(['tenant_id' => $maungTenant->id]);

        // 4. Bersihkan tenant duplikat kosong 'Nabila Store' (slug: nabila-store) jika ada
        Tenant::where('slug', 'nabila-store')
            ->where('id', '!=', $maungTenant->id)
            ->delete();
    }
}
