<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiQueryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'query',
        'response',
        'tokens_used',
    ];

    protected function casts(): array
    {
        return [
            'tokens_used' => 'integer',
        ];
    }

    // ===== RELASI =====

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
        // ↑ Log ini dibuat oleh user mana
        // Akses: $log->user->name
    }
}
