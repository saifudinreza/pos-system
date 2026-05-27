<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id', 'plan', 'billing_cycle', 'amount', 'status',
        'midtrans_order_id', 'snap_token', 'payment_method',
        'paid_at', 'expires_at', 'midtrans_response',
    ];

    protected $casts = [
        'paid_at'           => 'datetime',
        'expires_at'        => 'datetime',
        'midtrans_response' => 'array',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
