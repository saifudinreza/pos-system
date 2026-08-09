<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Snapshot harga modal per item order — dipakai untuk hitung COGS
        // & profit di laporan penjualan. Nullable: produk lama boleh tanpa cost.
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('cost', 12, 2)->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('cost');
        });
    }
};
