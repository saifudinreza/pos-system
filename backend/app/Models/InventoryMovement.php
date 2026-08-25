<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model InventoryMovement, catatan ledger pergerakan stok (inventory ledger).
 *
 * Tabel: `inventory_movements`. Setiap perubahan stok tercatat dengan snapshot
 * before_stock/after_stock plus referensi sumber perubahan (ref_type/ref_id:
 * sale, cancel, restock). Global scope TenantScope aktif.
 * Casts: quantity/before_stock/after_stock/ref_id → integer.
 */
class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'product_id',
        'type',
        'quantity',
        'before_stock',
        'after_stock',
        'ref_type',
        'ref_id',
        'user_id',
        'note',
    ];

    /**
     * Daftarkan TenantScope secara global, dipanggil otomatis oleh Eloquent.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    /**
     * Cast atribut model, dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'quantity'     => 'integer',
            'before_stock' => 'integer',
            'after_stock'  => 'integer',
            'ref_id'       => 'integer',
        ];
    }

    // ===== RELASI =====

    /**
     * Relasi: pergerakan stok ini merujuk satu produk.
     */
    public function product(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relasi: siapa user yang memicu pergerakan stok ini.
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
