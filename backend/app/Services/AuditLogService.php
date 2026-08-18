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
    /**
     * Catat satu kejadian audit (perubahan produk, harga, role, plan, setting tenant).
     *
     * Dipanggil dari controller SETELAH aksi utama berhasil. Kegagalan menulis
     * audit log tidak boleh menggagalkan operasi utama — cukup dicatat di log
     * aplikasi (try/catch).
     *
     * @param string $action         Nama aksi, mis. 'product_updated', 'role_changed'
     * @param string|null $entityType Tipe entitas terkait (product, user, tenant, ...)
     * @param int|string|null $entityId ID entitas yang diubah
     * @param mixed $before          Snapshot data sebelum perubahan (untuk diff)
     * @param mixed $after           Snapshot data sesudah perubahan
     */
    public static function log(
        string $action,
        ?string $entityType = null,
        $entityId = null,
        $before = null,
        $after = null
    ): void {
        try {
            AuditLog::create([
                // Konteks user dari session; null kalau aksi tanpa login (mis. webhook)
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
