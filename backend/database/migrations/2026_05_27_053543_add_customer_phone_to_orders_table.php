<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Nomor HP customer untuk kirim struk via WhatsApp
            // Nullable: kalau kasir tidak isi, struk tidak dikirim (tidak wajib)
            $table->string('customer_phone')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('customer_phone');
        });
    }
};
