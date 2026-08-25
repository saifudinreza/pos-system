<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model Subscription, riwayat pembelian/langganan plan (Free/Pro/Enterprise).
 *
 * Tabel: `subscriptions`. Menyimpan data pembayaran langganan via Midtrans
 * (snap token, status, respons webhook) dan masa berlaku langganan.
 * Casts: paid_at & expires_at → datetime, midtrans_response → array.
 */
class Subscription extends Model
{
    protected $fillable = [
        'user_id', 'plan', 'billing_cycle', 'amount', 'status',
        'midtrans_order_id', 'snap_token', 'payment_method',
        'paid_at', 'expires_at', 'midtrans_response',
    ];

    protected $casts = [
        'paid_at'           => 'datetime', // kapan langganan dibayar
        'expires_at'        => 'datetime', // kapan langganan berakhir
        'midtrans_response' => 'array',    // respons webhook Midtrans (JSON → array)
    ];

    /**
     * Relasi: subscription ini milik satu user.
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
