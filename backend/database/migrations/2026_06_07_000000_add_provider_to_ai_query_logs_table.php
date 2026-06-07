<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_query_logs', function (Blueprint $table) {
            $table->string('provider', 20)->nullable()->after('tokens_used');
        });
    }

    public function down(): void
    {
        Schema::table('ai_query_logs', function (Blueprint $table) {
            $table->dropColumn('provider');
        });
    }
};
