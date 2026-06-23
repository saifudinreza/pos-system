<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'shift_number',
        'shift_name',
        'status',
        'opened_at',
        'closed_at',
        'opening_balance',
        'closing_balance',
        'expected_balance',
        'difference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'opened_at'        => 'datetime',
            'closed_at'        => 'datetime',
            'opening_balance'  => 'decimal:2',
            'closing_balance'  => 'decimal:2',
            'expected_balance' => 'decimal:2',
            'difference'       => 'decimal:2',
            'shift_number'     => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public static function getShiftForTime(): array
    {
        $hour = now()->hour;
        if ($hour >= 6 && $hour < 14) return [1, 'Pagi'];
        if ($hour >= 14 && $hour < 22) return [2, 'Siang'];
        return [3, 'Malam'];
    }
}
