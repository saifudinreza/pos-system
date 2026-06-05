<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiChatUsage extends Model
{
    protected $table = 'ai_chat_usage';

    protected $fillable = ['user_id', 'usage_date', 'count'];

    protected $casts = ['usage_date' => 'date'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
