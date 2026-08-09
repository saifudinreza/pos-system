<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============================================================
        // INVENTORY LEDGER (stock movements)
        // Selama ini `products.stock` cuma angka counter tanpa riwayat.
        // Tabel ini mencatat SETIAP perubahan stok (penjualan, pembatalan,
        // restok, penyesuaian) sehingga bisa diaudit & dianalisis:
        // "berapa terjual kemarin", "stok naik kenapa?", dsb.
        // ============================================================
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // sale | cancel | restock | adjust
            $table->integer('quantity');      // selalu positif; arah ditentukan type
            $table->integer('before_stock');
            $table->integer('after_stock');
            $table->string('ref_type')->nullable(); // order | transaction
            $table->unsignedBigInteger('ref_id')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'created_at'], 'movements_product_date_idx');
            $table->index(['tenant_id', 'type', 'created_at'], 'movements_tenant_type_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
