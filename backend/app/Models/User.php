<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    // ↑ HasApiTokens = dari Sanctum, wajib ada supaya user bisa punya token login
    // ↑ HasFactory  = untuk bikin fake data saat testing/seeding
    // ↑ Notifiable  = supaya user bisa terima notifikasi Laravel

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'is_active',
    ];
    // ↑ Kolom yang boleh diisi via User::create() atau $user->update()
    // Kolom yang tidak ada di sini tidak bisa diisi massal (mass assignment protection)

    protected $hidden = [
        'password',
        'remember_token',
    ];
    // ↑ Kolom ini disembunyikan saat model diconvert ke JSON
    // Jadi response API tidak akan pernah expose password ke frontend

    protected function casts(): array
    {
        return [
            'is_active'         => 'boolean',
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            // ↑ 'hashed' = Laravel otomatis hash password saat diset
            // Jadi tidak perlu Hash::make() manual di controller
        ];
    }

    // ===== RELASI =====

    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class);
        // ↑ Satu user bisa punya banyak order
        // Akses: $user->orders
    }

    public function aiQueryLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AiQueryLog::class);
        // ↑ Satu user bisa punya banyak riwayat query AI
        // Akses: $user->aiQueryLogs
    }

    // ===== HELPER =====

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
        // ↑ Cek apakah user adalah admin
        // Penggunaan: if ($user->isAdmin()) { ... }
    }

    public function isKasir(): bool
    {
        return $this->role === 'kasir';
    }
}