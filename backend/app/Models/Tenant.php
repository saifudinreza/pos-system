<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Tenant — merepresentasikan satu toko/UMKM (unit bisnis) di KasirAI.
 *
 * Tabel: `tenants`. Hampir semua model tenant-aware ber-relasi ke sini dan
 * difilter otomatis via TenantScope. Menyimpan juga konfigurasi pembayaran
 * per-tenant (split payment).
 * Casts: is_active → boolean, midtrans_server_key → encrypted (server key
 * Midtrans dienkripsi di database), midtrans_is_production → boolean
 * (nullable — kalau kosong, ikut mode platform via midtransIsProduction()).
 */
class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'midtrans_server_key',
        'midtrans_client_key',
        'midtrans_is_production',
    ];

    /**
     * Cast atribut model — dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'is_active'               => 'boolean',
            'midtrans_server_key'     => 'encrypted', // server key Midtrans dienkripsi di DB
            'midtrans_is_production'  => 'boolean',
        ];
    }

    // Mode Midtrans efektif untuk tenant ini: pakai preferensi tenant kalau
    // sudah diisi (isi server key sendiri), fallback ke mode platform kalau belum.
    public function midtransIsProduction(): bool
    {
        return $this->midtrans_is_production ?? config('services.midtrans.is_production');
    }

    /**
     * Relasi: satu tenant punya banyak user.
     */
    public function users(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Relasi: satu tenant punya banyak produk.
     */
    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Relasi: satu tenant punya banyak kategori.
     */
    public function categories(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Category::class);
    }

    /**
     * Relasi: satu tenant punya banyak order.
     */
    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class);
    }
}
