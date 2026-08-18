<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Model User — merepresentasikan pengguna KasirAI (developer, admin, kasir, customer).
 *
 * Tabel: `users`. Multi-tenant: global scope TenantScope aktif, jadi user
 * non-developer hanya melihat user lain di tenant yang sama; developer
 * (tenant_id = null) tidak difilter sehingga bisa melihat lintas tenant.
 * Casts: is_active → boolean, password → hashed (otomatis di-hash saat
 * disimpan), email_verified_at → datetime. Auth memakai Laravel Sanctum.
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Daftarkan TenantScope secara global — dipanggil otomatis oleh Eloquent
     * saat model pertama kali digunakan.
     */
    protected static function booted(): void
    {
        // TenantScope: user non-developer hanya melihat user dari tenant yang sama.
        // (Developer punya tenant_id = null → scope tidak memfilter → lihat semua.)
        static::addGlobalScope(new TenantScope);
    }

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'password',
        'role',
        'phone',
        'is_active',
        'subscription_plan',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Cast atribut model — dipanggil otomatis oleh Eloquent.
     */
    protected function casts(): array
    {
        return [
            'is_active'         => 'boolean',
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ===== RELASI =====

    /**
     * Relasi: user milik satu tenant (developer bisa tidak punya tenant).
     */
    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Relasi: satu user bisa membuat banyak order.
     */
    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Relasi: satu user punya banyak log query AI.
     */
    public function aiQueryLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AiQueryLog::class);
    }

    /**
     * Relasi: satu user punya banyak riwayat subscription (langganan plan).
     */
    public function subscriptions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    // ===== HELPER =====

    /**
     * Cek apakah user berperan admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Cek apakah user berperan kasir.
     */
    public function isKasir(): bool
    {
        return $this->role === 'kasir';
    }

    /**
     * Cek apakah user berperan developer.
     */
    public function isDeveloper(): bool
    {
        return $this->role === 'developer';
    }
}
