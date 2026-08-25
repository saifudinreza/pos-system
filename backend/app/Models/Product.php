<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Product, mewakili satu produk/jasa yang dijual toko.
 *
 * Tabel: `products`. Global scope TenantScope aktif. Menyimpan harga jual
 * (price), harga modal (cost, untuk COGS) dan stok.
 * Casts: price & cost → decimal:2, stock & stock_alert → integer,
 * is_active → boolean.
 */
class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'sku',
        'description',
        'price',
        'cost',
        'stock',
        'stock_alert',
        'image',
        'is_active',
    ];

    /**
     * Cast atribut model, dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'price'       => 'decimal:2',
            'cost'        => 'decimal:2',
            'is_active'   => 'boolean',
            'stock'       => 'integer',
            'stock_alert' => 'integer',
        ];
    }

    /**
     * Daftarkan TenantScope secara global, dipanggil otomatis oleh Eloquent.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    // ===== RELASI =====

    /**
     * Relasi: produk ini milik satu tenant.
     */
    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relasi: produk termasuk ke dalam satu kategori.
     */
    public function category(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Relasi: satu produk muncul di banyak baris order item.
     */
    public function orderItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // ===== HELPER =====

    /**
     * Cek apakah stok sudah mencapai/sama dengan batas alert (stok menipis).
     */
    public function isLowStock(): bool
    {
        return $this->stock <= $this->stock_alert;
    }

    /**
     * Kurangi stok produk langsung di database (decrement kolom `stock`).
     */
    public function decreaseStock(int $quantity): void
    {
        $this->decrement('stock', $quantity);
    }
}
