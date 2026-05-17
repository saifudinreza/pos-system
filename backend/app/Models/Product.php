<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'sku',
        'description',
        'price',
        'stock',
        'stock_alert',
        'image',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price'       => 'decimal:2',
            // ↑ Selalu return 2 angka di belakang koma, contoh: 15000.00
            'is_active'   => 'boolean',
            'stock'       => 'integer',
            'stock_alert' => 'integer',
        ];
    }

    // ===== RELASI =====

    public function category(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Category::class);
        // ↑ Produk ini milik satu kategori
        // Akses: $product->category->name
    }

    public function orderItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderItem::class);
        // ↑ Produk ini pernah masuk ke order_items mana saja
        // Akses: $product->orderItems (untuk laporan produk terlaris)
    }

    // ===== HELPER =====

    public function isLowStock(): bool
    {
        return $this->stock <= $this->stock_alert;
        // ↑ Cek apakah stok sudah di bawah batas alert
        // Dipakai AI untuk prediksi dan alert restok
    }

    public function decreaseStock(int $quantity): void{
        $this->decrement('stock', $quantity);
        // ↑ Kurangi stok saat transaksi sukses
        // decrement() langsung update ke DB, aman untuk concurrent request
    }
}
