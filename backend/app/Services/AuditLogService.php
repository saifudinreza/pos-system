<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

/**
 * Pencatat audit log untuk perubahan data penting (produk, harga, role,
 * plan, setting tenant). Dipanggil dari controller, bukan model event —
 * supaya kita kontrol penuh apa yang dicatat & konteksnya (siapa, IP).
 */
class AuditLogService
{
    public static function log(
        string $action,
        ?string $entityType = null,
        $entityId = null,
        $before = null,
        $after = null
    ): void {
        try {
            AuditLog::create([
                'tenant_id'   => auth()->id() ? auth()->user()->tenant_id : null,
                'user_id'     => auth()->id(),
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'before'      => $before,
                'after'       => $after,
                'ip_address'  => request()->ip(),
            ]);
        } catch (\Throwable $e) {
            // Audit log tidak boleh menggagalkan operasi utamanya.
            Log::warning('Gagal menulis audit log: ' . $e->getMessage());
        }
    }
}
