<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->text('midtrans_server_key')->nullable()->after('is_active');
            $table->string('midtrans_client_key')->nullable()->after('midtrans_server_key');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['midtrans_server_key', 'midtrans_client_key']);
        });
    }
};
