<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Customer — CRM ringan: data pelanggan toko (dihubungkan via nomor HP).
 *
 * Tabel: `customers`. Global scope TenantScope aktif. Nomor HP disimpan
 * ternormalisasi format 62 (lihat normalizePhone()) agar pencocokan pelanggan
 * yang sudah ada konsisten. Pelanggan dibuat otomatis saat kasir mengisi
 * nomor HP di POS (findOrCreateByPhone) lalu tertaut ke orders.customer_id.
 */
class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'notes',
    ];

    /**
     * Daftarkan TenantScope secara global — dipanggil otomatis oleh Eloquent.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    // ===== RELASI =====

    /**
     * Relasi: customer ini milik satu tenant.
     */
    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relasi: satu customer bisa punya banyak order.
     */
    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class);
    }

    // ===== HELPER =====

    /**
     * Normalisasi nomor HP Indonesia ke format 62:
     *  08123456789 → 628123456789
     *  8123456789  → 628123456789
     *  +628...     → 628...
     * Dipakai untuk mencocokkan pelanggan yang sudah ada.
     */
    public static function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }
        // Buang semua karakter non-digit dulu (spasi, strip, tanda +, dll)
        $digits = preg_replace('/\D/', '', (string) $phone) ?? '';

        if (str_starts_with($digits, '0')) {
            // Format lokal "08..." → ganti 0 awal dengan 62
            $digits = '62' . substr($digits, 1);
        } elseif (str_starts_with($digits, '8')) {
            // Format internasional tanpa +62 → tambahkan 62 di depan
            $digits = '62' . $digits;
        }

        return $digits === '' ? null : $digits;
    }

    /**
     * Cari pelanggan berdasarkan nomor HP (dinormalisasi), atau buat baru.
     * Mengembalikan null kalau nomor HP kosong/tidak valid.
     */
    public static function findOrCreateByPhone(?string $phone, ?string $tenantId): ?Customer
    {
        $normalized = self::normalizePhone($phone);
        if (! $normalized) {
            return null;
        }

        return self::query()
            ->where('phone', $normalized)
            ->firstOrCreate(
                // Mencocokkan kombinasi phone + tenant (pelanggan per toko)
                ['phone' => $normalized, 'tenant_id' => $tenantId],
                ['phone' => $normalized, 'tenant_id' => $tenantId, 'name' => null]
            );
    }
}
