<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'midtrans_server_key',
        'midtrans_client_key',
        'midtrans_is_production',
    ];

    protected function casts(): array
    {
        return [
            'is_active'               => 'boolean',
            'midtrans_server_key'     => 'encrypted',
            'midtrans_is_production'  => 'boolean',
        ];
    }

    // Mode Midtrans efektif untuk tenant ini: pakai preferensi tenant kalau
    // sudah diisi (isi server key sendiri), fallback ke mode platform kalau belum.
    public function midtransIsProduction(): bool
    {
        return $this->midtrans_is_production ?? config('services.midtrans.is_production');
    }

    public function users(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class);
    }

    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function categories(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class);
    }
}
