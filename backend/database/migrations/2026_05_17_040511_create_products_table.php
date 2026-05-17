<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {

            $table->id();

            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            // ↑ foreignId() = bikin kolom category_id bertipe unsignedBigInteger
            // constrained() = otomatis references('id')->on('categories')
            // cascadeOnDelete() = kalau kategori dihapus, produknya ikut terhapus
            // PENTING: migration categories harus dijalankan DULU sebelum ini

            $table->string('name');
            // ↑ Nama produk, contoh: "Indomie Goreng", "Es Teh"

            $table->string('sku')->unique();
            // ↑ Stock Keeping Unit - kode unik tiap produk
            // Contoh: "PRD-001", "MNM-TEH-001"
            // Dipakai kasir untuk scan/input produk dengan cepat

            $table->text('description')->nullable();
            // ↑ Deskripsi produk, boleh kosong (nullable)

            $table->decimal('price', 12, 2);
            // ↑ Harga produk
            // 12 = total digit, 2 = digit di belakang koma
            // Bisa simpan sampai 9.999.999.999,99

            $table->integer('stock')->default(0);
            // ↑ Jumlah stok saat ini
            // Berkurang otomatis setiap ada transaksi sukses

            $table->integer('stock_alert')->default(10);
            // ↑ Batas minimum stok sebelum AI kasih alert restok
            // Contoh: kalau stock <= stock_alert, kirim notifikasi

            $table->string('image')->nullable();
            // ↑ Path foto produk, contoh: "products/indomie.jpg"
            // Disimpan di storage Laravel, nullable karena foto opsional

            $table->boolean('is_active')->default(true);
            // ↑ Produk nonaktif tidak muncul di menu customer/kasir
            // Lebih aman daripada hapus produk yang sudah pernah ditransaksikan

            $table->timestamps();

            // Index untuk mempercepat query filter & search
            $table->index('name');
            // ↑ Karena sering di-search by name: WHERE name LIKE '%indomie%'

            $table->index('is_active');
            // ↑ Karena hampir semua query filter: WHERE is_active = true
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};