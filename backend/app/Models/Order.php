<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Order, mewakili satu transaksi penjualan (keranjang yang sudah jadi).
 *
 * Tabel: `orders`. Global scope TenantScope aktif. Terhubung ke shift
 * (sesi kasir), customer (CRM ringan via nomor HP) dan transaction
 * (pembayaran). Nomor order dibuat unik global via generateOrderNumber().
 * Casts: subtotal, tax, total → decimal:2.
 */
class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'customer_id',
        'shift_id',
        'order_number',
        'status',
        'subtotal',
        'tax',
        'total',
        'notes',
        'customer_phone',
    ];

    /**
     * Cast atribut model, dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax'      => 'decimal:2',
            'total'    => 'decimal:2',
        ];
    }

    /**
     * Daftarkan TenantScope secara global, dipanggil otomatis oleh Eloquent.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    // ===== RELASI =====

    /**
     * Relasi: order ini milik satu tenant.
     */
    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relasi: order ini terkait satu customer (bisa null kalau anonim).
     */
    public function customer(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Relasi: order dibuat oleh satu user (kasir yang melayani).
     */
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi: satu order punya banyak baris item.
     */
    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Relasi: satu order maksimal punya satu pembayaran (transaction).
     */
    public function transaction(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Transaction::class);
    }

    // ===== HELPER =====

    /**
     * Generate nomor order unik global: ORD-{Ymd}-{urutan 4 digit}.
     * Contoh: ORD-20260818-0007
     */
    public static function generateOrderNumber(): string
    {
        $date  = now()->format('Ymd');
        $count = static::withoutGlobalScopes()->whereDate('created_at', today())->count() + 1;
        return 'ORD-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        // withoutGlobalScopes() supaya count semua order hari ini (cross-tenant)
        // Menjaga nomor order tetap unik secara global
    }

    /**
     * Cek apakah order sudah berstatus paid (dibayar lunas).
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Cek apakah order masih berstatus pending (belum dibayar).
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
