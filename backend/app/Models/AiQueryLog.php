<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model AiQueryLog — log pertanyaan & jawaban AI per user.
 *
 * Tabel: `ai_query_logs`. Tidak memakai TenantScope karena tabel ini tidak
 * punya kolom tenant_id — log dihubungkan lewat user dan difilter manual
 * di controller (AiController::logs()/stats() memakai scope per user untuk
 * admin, atau lintas tenant untuk developer).
 * Casts: tokens_used → integer.
 */
class AiQueryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'query',
        'response',
        'tokens_used',
        'provider',
    ];

    /**
     * Cast atribut model — dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'tokens_used' => 'integer',
        ];
    }

    // ===== RELASI =====

    /**
     * Relasi: log ini dibuat oleh user mana.
     * Akses: $log->user->name
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
        // ↑ Log ini dibuat oleh user mana
    }
}
