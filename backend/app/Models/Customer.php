<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'notes',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    // ===== RELASI =====

    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

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
        $digits = preg_replace('/\D/', '', (string) $phone) ?? '';

        if (str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        } elseif (str_starts_with($digits, '8')) {
            $digits = '62' . $digits;
        }

        return $digits === '' ? null : $digits;
    }

    /** Cari pelanggan berdasarkan nomor HP (dinormalisasi), atau buat baru. */
    public static function findOrCreateByPhone(?string $phone, ?string $tenantId): ?Customer
    {
        $normalized = self::normalizePhone($phone);
        if (! $normalized) {
            return null;
        }

        return self::query()
            ->where('phone', $normalized)
            ->firstOrCreate(
                ['phone' => $normalized, 'tenant_id' => $tenantId],
                ['phone' => $normalized, 'tenant_id' => $tenantId, 'name' => null]
            );
    }
}
