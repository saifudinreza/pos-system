<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Record pekerjaan AI yang dieksekusi secara async oleh queue worker.
 * Frontend membuat job via POST /api/ai/* lalu mem-poll GET /api/ai/jobs/{id}.
 *
 * Penting: prompt SUDAH dibuat di controller (masih dalam konteks request
 * dengan auth, jadi isolasi tenant aman). Job worker hanya memanggil LLM
 * (GroqService::ask) tanpa menyentuh query database — supaya tidak ada risiko
 * data tenant bocor ke tenant lain saat worker jalan tanpa user login.
 */
class AiJob extends Model
{
    use HasFactory;

    protected $table = 'ai_jobs';

    protected $fillable = [
        'user_id',
        'tenant_id',
        'type',
        'query',
        'prompt',
        'status',
        'response',
        'tokens_used',
        'provider',
        'model',
        'error',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'tokens_used'  => 'integer',
            'processed_at' => 'datetime',
        ];
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}