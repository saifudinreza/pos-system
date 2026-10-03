<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Developer (sistem, tanpa tenant), SATU-SATUNYA developer.
        //    Emailnya dari config/kasirai.php (env DEVELOPER_EMAIL).
        //    Kata sandi TIDAK ditulis di kode (repo ini publik) dan TIDAK direset
        //    kalau akunnya sudah ada. Akun baru memakai env DEVELOPER_SEED_PASSWORD;
        //    kalau kosong dibuat acak, lalu atur sandi lewat "Lupa password".
        $developer = User::firstOrNew(['email' => User::developerEmail()]);
        $isNew = ! $developer->exists;

        $developer->tenant_id = null;
        $developer->role      = 'developer';
        $developer->is_active = true;

        if ($isNew) {
            $seedPassword = env('DEVELOPER_SEED_PASSWORD');
            $developer->name     = 'Saifudin Reza';
            $developer->password = Hash::make($seedPassword ?: Str::random(40));

            if (! $seedPassword && $this->command) {
                $this->command->warn('Akun developer dibuat dengan kata sandi ACAK. Atur sandi lewat "Lupa password" (OTP email).');
            }
        }
        $developer->save();

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

        // 3. Bersihkan tenant duplikat kosong 'Nabila Store' (slug: nabila-store) jika ada
        Tenant::where('slug', 'nabila-store')
            ->where('id', '!=', $maungTenant->id)
            ->delete();

        // Konsolidasi produk & kategori ke tenant ini ditangani oleh
        // RepairNabilaTenant (dipanggil di akhir DatabaseSeeder) supaya
        // berjalan SETELAH data Category/Product ada.
    }
}
