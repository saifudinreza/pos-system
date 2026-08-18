<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Model Category — pengelompokan produk.
 *
 * Tabel: `categories`. Global scope TenantScope aktif. Saat kategori dibuat,
 * slug otomatis di-generate dari nama (event creating). Casts: is_active →
 * boolean.
 */
class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'is_active',
    ];

    /**
     * Cast atribut model — dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Daftarkan TenantScope secara global + event creating untuk auto-slug.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());

        // Auto-generate slug dari nama kategori saat pertama kali dibuat
        // (mis. "Minuman Dingin" → "minuman-dingin")
        static::creating(function ($category) {
            $category->slug = Str::slug($category->name);
        });
    }

    // ===== RELASI =====

    /**
     * Relasi: kategori ini milik satu tenant.
     */
    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relasi: satu kategori menampung banyak produk.
     */
    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class);
    }
}
