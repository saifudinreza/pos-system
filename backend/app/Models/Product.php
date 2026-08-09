<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    // ===== RELASI =====

    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // ===== HELPER =====

    public function isLowStock(): bool
    {
        return $this->stock <= $this->stock_alert;
    }

    public function decreaseStock(int $quantity): void
    {
        $this->decrement('stock', $quantity);
    }
}
