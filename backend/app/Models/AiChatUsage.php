<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model AiChatUsage, penghitung kuota pemakaian AI per user per hari.
 *
 * Tabel: `ai_chat_usage`. Satu baris per user per tanggal; kolom `count`
 * bertambah tiap kali kuota AI dipakai. Dijumlah via AiChatUsageService
 * (todayUsage() untuk kuota harian pro/enterprise, currentUsage() untuk
 * kuota bulanan free). Casts: usage_date → date.
 */
class AiChatUsage extends Model
{
    protected $table = 'ai_chat_usage';

    protected $fillable = ['user_id', 'usage_date', 'count'];

    protected $casts = ['usage_date' => 'date'];

    /**
     * Relasi: pemakaian kuota ini milik satu user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}