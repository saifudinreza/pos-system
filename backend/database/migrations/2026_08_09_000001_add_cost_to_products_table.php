<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Harga beli/modal per produk — enabler fitur Profit & Margin.
        // Nullable: tenant bebas mengisi bertahap, produk lama tidak wajib.
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('cost', 12, 2)->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('cost');
        });
    }
};
