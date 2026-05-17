<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {

            $table->id();
            // ↑ Primary key auto increment, alias dari bigIncrements('id')

            $table->string('name');
            // ↑ Nama kategori, contoh: "Makanan", "Minuman", "Snack"

            $table->string('slug')->unique();
            // ↑ Versi URL-friendly dari name, contoh: "makanan", "minuman"
            // unique() = tidak boleh ada 2 kategori dengan slug sama
            // Ini dipakai untuk filter produk via URL: /products?category=makanan

            $table->boolean('is_active')->default(true);
            // ↑ Kalau false, kategori disembunyikan dari tampilan customer
            // Admin bisa nonaktifkan kategori tanpa harus hapus datanya

            $table->timestamps();
            // ↑ Otomatis bikin 2 kolom: created_at dan updated_at
            // Laravel update updated_at otomatis setiap kali data diubah
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
        // ↑ Dijalankan saat php artisan migrate:rollback
        // Hapus tabel categories dari database
    }
};