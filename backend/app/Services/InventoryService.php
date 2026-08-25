<?php

namespace App\Services;

use App\Models\InventoryMovement;
use Illuminate\Support\Facades\Log;

/**
 * Pencatat pergerakan stok (inventory ledger).
 *
 * Setiap perubahan stok produk (penjualan, pembatalan, restok, penyesuaian)
 * WAJIB lewat service ini supaya `products.stock` selalu punya jejak audit.
 * Catatan: service ini TIDAK mengubah stok, dia hanya mencatat. Perubahan
 * stok tetap dilakukan oleh pemanggil (decrement/increment).
 */
class InventoryService
{
    /**
     * Catat satu pergerakan stok ke ledger inventory.
     *
     * Service ini HANYA mencatat, perubahan `products.stock` tetap dilakukan
     * oleh pemanggil (decrement/increment). `before_stock`/`after_stock`
     * adalah snapshot yang dipakai untuk riwayat pergerakan.
     *
     * @param int    $productId   produk yang stoknya berubah
     * @param int|null $tenantId  tenant pemilik produk (bisa null di webhook tanpa login)
     * @param string $type        sale | cancel | restock | adjust
     * @param int    $quantity    jumlah (selalu positif)
     * @param int    $beforeStock stok SEBELUM berubah
     * @param int    $afterStock  stok SESUDAH berubah
     */
    public static function record(
        int $productId,
        ?int $tenantId,
        string $type,
        int $quantity,
        int $beforeStock,
        int $afterStock,
        ?string $refType = null,
        ?int $refId = null,
        ?int $userId = null,
        ?string $note = null
    ): void {
        try {
            InventoryMovement::create([
                'tenant_id'    => $tenantId,
                'product_id'   => $productId,
                'type'         => $type,
                'quantity'     => $quantity,
                'before_stock' => $beforeStock,
                'after_stock'  => $afterStock,
                'ref_type'     => $refType,
                'ref_id'       => $refId,
                'user_id'      => $userId ?? auth()->id(), // user dari context request kalau tidak dikirim eksplisit
                'note'         => $note,
            ]);
        } catch (\Throwable $e) {
            // Pencatatan ledger jangan sampai menggagalkan transaksi utama.
            Log::warning('Gagal mencatat inventory movement: ' . $e->getMessage());
        }
    }
}
