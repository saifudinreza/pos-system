<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'order_number',
        'status',
        'subtotal',
        'tax',
        'total',
        'notes',
        'customer_phone',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax'      => 'decimal:2',
            'total'    => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    // ===== RELASI =====

    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function transaction(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Transaction::class);
    }

    // ===== HELPER =====

    public static function generateOrderNumber(): string
    {
        $date  = now()->format('Ymd');
        $count = static::withoutGlobalScopes()->whereDate('created_at', today())->count() + 1;
        return 'ORD-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        // withoutGlobalScopes() supaya count semua order hari ini (cross-tenant)
        // Menjaga nomor order tetap unik secara global
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
