<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {

            $table->id();

            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // ↑ Item ini milik order mana
            // cascadeOnDelete = kalau order dihapus, item-nya ikut terhapus

            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            // ↑ Item ini produk apa

            $table->integer('quantity');
            // ↑ Berapa banyak produk ini dipesan dalam satu order

            $table->decimal('price', 12, 2);
            // ↑ SNAPSHOT harga produk saat transaksi terjadi
            // PENTING: tidak pakai products.price langsung!
            // Karena harga produk bisa berubah kapan saja,
            // tapi harga di struk harus sesuai harga saat beli

            $table->decimal('subtotal', 12, 2);
            // ↑ Hasil dari quantity × price
            // Disimpan di DB biar tidak perlu hitung ulang tiap query laporan

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};