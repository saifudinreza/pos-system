<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;
    
    protected $fillable = [
         'order_id',
        'midtrans_order_id',
        'midtrans_transaction_id',
        'payment_method',
        'status',
        'amount',
        'snap_token',
        'paid_at',
        'midtrans_response',
    ];

    protected function casts(): array
    {
        return [
            'amount'             => 'decimal:2',
            'paid_at'            => 'datetime',
            // ↑ Otomatis convert ke Carbon datetime object
            // Bisa langsung: $transaction->paid_at->format('d M Y')
            'midtrans_response'  => 'array',
            // ↑ Otomatis convert JSON string ke PHP array saat diakses
            // Jadi tidak perlu json_decode() manual
        ];
    }

    // =====RELASI =====

    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this-> belongsTo(Order::class);
        // ↑ Transaksi ini untuk order mana
        // Akses: $transaction->order->order_number
    }

    // ===== HELPER =====

    public function isSettled(): bool
    {
        return $this->status === 'settlement';
        // ↑ Cek apakah pembayaran sudah sukses
        // Dipakai di webhook handler untuk update stok dan status order
    }
}
