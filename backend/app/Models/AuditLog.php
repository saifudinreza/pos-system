<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model AuditLog, catatan jejak aksi admin untuk traceability.
 *
 * Tabel: `audit_logs`. Menyimpan snapshot sebelum/sesudah data yang diubah
 * (format array) plus pelaku dan IP. Global scope TenantScope aktif.
 * Dicatat otomatis oleh AuditLogService::log() untuk aksi create/update/
 * delete produk, restock, role change, dll.
 * Casts: before & after → array, entity_id → integer.
 */
class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'before',
        'after',
        'ip_address',
    ];

    /**
     * Daftarkan TenantScope secara global, dipanggil otomatis oleh Eloquent.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    /**
     * Cast atribut model, dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'before'    => 'array', // snapshot data sebelum diubah (JSON → array)
            'after'     => 'array', // snapshot data sesudah diubah
            'entity_id' => 'integer',
        ];
    }

    // ===== RELASI =====

    /**
     * Relasi: log ini dibuat oleh satu user.
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
