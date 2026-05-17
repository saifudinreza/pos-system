<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;


class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'is_active',
    ];

    
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            // ↑ Supaya is_active return true/false bukan "1"/"0"
        ];
    }

    // ===== BOOT =====

    protected static function boot(): void{
        parent::boot();

        static::creating(function ($category) {
            $category->slug = Str::slug($category->name);
            // ↑ Otomatis generate slug saat category dibuat
            // Contoh: name "Makanan Berat" → slug "makanan-berat"
            // Jadi tidak perlu input slug manual dari frontend
        });
    }

    // ===== RELASI =====

    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class);
        // ↑ Satu kategori punya banyak produk
        // Akses: $category->products
    }
}
