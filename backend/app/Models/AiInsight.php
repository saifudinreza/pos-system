<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model AiInsight — hasil insight bisnis yang ditulis AI.
 *
 * Tabel: `ai_insights`. Menyimpan insight (penjualan/stok/pelanggan) yang
 * di-generate dari data 3 periode (hari_ini/minggu_ini/bulan_ini) — lihat
 * InsightService. Global scope TenantScope aktif.
 * Casts: data → array (data pendukung insight), period_start/period_end → date.
 */
class AiInsight extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'type',
        'title',
        'body',
        'data',
        'period_start',
        'period_end',
    ];

    /**
     * Daftarkan TenantScope secara global — dipanggil otomatis oleh Eloquent.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    /**
     * Cast atribut model — dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'data'         => 'array', // data pendukung insight (JSON → array)
            'period_start' => 'date',
            'period_end'   => 'date',
        ];
    }
}