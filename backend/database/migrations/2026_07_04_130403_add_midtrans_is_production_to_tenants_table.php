<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // null = ikut mode platform (config MIDTRANS_IS_PRODUCTION)
            // true/false = tenant override sendiri, dipakai kalau tenant isi server key sendiri
            $table->boolean('midtrans_is_production')->nullable()->after('midtrans_client_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('midtrans_is_production');
        });
    }
};
