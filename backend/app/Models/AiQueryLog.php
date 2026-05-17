<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiQueryLog extends Model
{
    protected $fillable = ['user_id', 'type', 'query', 'response', 'tokens_used'];
}
