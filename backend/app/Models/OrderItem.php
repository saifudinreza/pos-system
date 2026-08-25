<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model OrderItem, baris item di dalam satu order.
 *
 * Tabel: `order_items`. Menyimpan snapshot harga jual (price) & harga modal
 * (cost) saat transaksi dibuat, supaya COGS/profit historis akurat walau
 * harga produk berubah kemudian.
 * Casts: price/cost/subtotal → decimal:2, quantity → integer.
 */
class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'price',
        'cost',
        'subtotal',
    ];

    /**
     * Cast atribut model, dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'price'    => 'decimal:2',
            'cost'     => 'decimal:2',
            'subtotal' => 'decimal:2',
            'quantity' => 'integer',
        ];
    }

    // ===== RELASI =====

    /**
     * Relasi: item ini milik satu order.
     */
    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
        // ↑ Item ini milik order mana
    }

    /**
     * Relasi: item ini merujuk satu produk.
     * Akses: $item->product->name, $item->product->price
     */
    public function product(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Product::class);
        // ↑ Item ini produk apa
    }
}
