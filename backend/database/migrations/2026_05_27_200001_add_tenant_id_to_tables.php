<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // tenant_id nullable di semua tabel
        // - null = akun developer (system-level, tidak milik toko manapun)
        // - terisi = data milik toko tersebut

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                  ->nullable()
                  ->after('id')
                  ->constrained()
                  ->nullOnDelete();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                  ->nullable()
                  ->after('id')
                  ->constrained()
                  ->nullOnDelete();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                  ->nullable()
                  ->after('id')
                  ->constrained()
                  ->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('tenant_id')
                  ->nullable()
                  ->after('id')
                  ->constrained()
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders',     fn($t) => $t->dropForeign(['tenant_id']));
        Schema::table('categories', fn($t) => $t->dropForeign(['tenant_id']));
        Schema::table('products',   fn($t) => $t->dropForeign(['tenant_id']));
        Schema::table('users',      fn($t) => $t->dropForeign(['tenant_id']));

        Schema::table('orders',     fn($t) => $t->dropColumn('tenant_id'));
        Schema::table('categories', fn($t) => $t->dropColumn('tenant_id'));
        Schema::table('products',   fn($t) => $t->dropColumn('tenant_id'));
        Schema::table('users',      fn($t) => $t->dropColumn('tenant_id'));
    }
};
