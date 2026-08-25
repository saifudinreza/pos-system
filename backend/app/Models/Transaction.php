<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Transaction, merepresentasikan pembayaran untuk satu order.
 *
 * Tabel: `transactions`. Menyimpan data pembayaran Midtrans (snap token,
 * status, respons webhook mentah) maupun pembayaran tunai. Satu order
 * berelasi hasOne ke satu transaction.
 * Casts: amount → decimal:2, paid_at → datetime, midtrans_response → array
 * (JSON string di database otomatis jadi PHP array saat diakses).
 */
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

    /**
     * Cast atribut model, dipanggil otomatis oleh Eloquent.
     */
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

    // ===== RELASI =====

    /**
     * Relasi: transaksi ini milik satu order.
     * Akses: $transaction->order->order_number
     */
    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
        // ↑ Transaksi ini untuk order mana
    }

    // ===== HELPER =====

    /**
     * Cek apakah pembayaran sudah sukses (status settlement).
     * Dipakai di webhook handler untuk update stok dan status order.
     */
    public function isSettled(): bool
    {
        return $this->status === 'settlement';
        // ↑ Cek apakah pembayaran sudah sukses
    }
}
