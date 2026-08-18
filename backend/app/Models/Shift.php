<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Shift — mewakili sesi kerja kasir (Pagi/Siang/Malam).
 *
 * Tabel: `shifts`. Penting: shift bersifat per-tenant, bukan per-user —
 * satu shift aktif dipakai bersama semua kasir dalam tenant yang sama.
 * Transaksi diblokir di luar jam shift (enforcement berbasis start_time/
 * end_time). Global scope TenantScope aktif.
 * Casts: nominal (opening/closing/expected/difference/petty_cash) →
 * decimal:2, denominasi → array, shift_number → integer,
 * opened_at/closed_at → datetime.
 */
class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'shift_number',
        'shift_name',
        'start_time',
        'end_time',
        'status',
        'opened_at',
        'closed_at',
        'opening_balance',
        'opening_note',
        'opening_denominations',
        'closing_balance',
        'closing_denominations',
        'expected_balance',
        'difference',
        'petty_cash',
        'petty_cash_note',
        'notes',
        'verified_by',
    ];

    /**
     * Cast atribut model — dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'opened_at'             => 'datetime',
            'closed_at'             => 'datetime',
            'opening_balance'       => 'decimal:2',
            'closing_balance'       => 'decimal:2',
            'expected_balance'      => 'decimal:2',
            'difference'            => 'decimal:2',
            'petty_cash'            => 'decimal:2',
            'opening_denominations' => 'array', // pecahan uang saat buka shift
            'closing_denominations' => 'array', // pecahan uang saat tutup shift
            'shift_number'          => 'integer',
        ];
    }

    /**
     * Daftarkan TenantScope secara global — dipanggil otomatis oleh Eloquent.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    /**
     * Relasi: shift ini milik satu tenant.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relasi: shift dibuka oleh satu user (kasir yang buka shift).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi: satu shift punya banyak order.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Tentukan nomor & nama shift berdasarkan jam sekarang.
     * Pagi (06–14), Siang (14–22), Malam (22–06).
     *
     * @return array{0: int, 1: string} [nomor_shift, nama_shift]
     */
    public static function getShiftForTime(): array
    {
        $hour = now()->hour;
        if ($hour >= 6 && $hour < 14) return [1, 'Pagi'];   // 06.00 – 13.59
        if ($hour >= 14 && $hour < 22) return [2, 'Siang']; // 14.00 – 21.59
        return [3, 'Malam'];                                // 22.00 – 05.59
    }
}
