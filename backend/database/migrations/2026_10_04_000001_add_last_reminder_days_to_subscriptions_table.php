<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pengingat langganan terakhir yang sudah dikirim untuk baris ini
     * (7, 3, 1, atau 0 = sudah berakhir). Mencegah email ganda.
     */
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->unsignedTinyInteger('last_reminder_days')->nullable()->after('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('last_reminder_days');
        });
    }
};
