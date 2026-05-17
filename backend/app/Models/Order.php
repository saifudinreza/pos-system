<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Override;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'subtotal',
        'tax',
        'total',
        'notes',
    ];

    
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax'      => 'decimal:2',
            'total'    => 'decimal:2',
        ];
    }

    // ===== RELASI =====

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
        // ↑ Order ini dibuat oleh siapa
        // Akses: $order->user->name
    }

    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderItem::class);
         // ↑ Order ini berisi produk apa saja
        // Akses: $order->items
    }

    public function transaction(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Transaction::class);
        // ↑ Data pembayaran Midtrans untuk order ini
        // HasOne karena satu order = satu transaksi pembayaran
        // Akses: $order->transaction->status
    }

    // ===== HELPER =====

    public static function generateOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $count = static::wheredate('created_at', today())->count() + 1;
        return 'ORD-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        // ↑ Generate nomor order unik berdasarkan tanggal + urutan hari ini
        // Contoh output: "ORD-20250517-0001", "ORD-20250517-0002"
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
        // ↑ Cek apakah order sudah dibayar
        // Dipakai untuk validasi sebelum cetak struk atau update stok
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
