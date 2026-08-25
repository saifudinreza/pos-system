<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============================================================
        // AI INSIGHTS, insight otomatis yang sudah dihasilkan server
        // (angka dihitung SQL deterministik, AI hanya merangkai kalimat).
        // Disimpan supaya tidak boros panggil LLM tiap dashboard dibuka.
        // ============================================================
        Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type'); // sales | stock | customer
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at'], 'insights_tenant_date_idx');
        });

        // Index komposit untuk query laporan periode (tenant + tanggal),
        // dipakai ReportController, ForecastService, dan InsightService.
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['tenant_id', 'created_at'], 'orders_tenant_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_tenant_created_idx');
        });
        Schema::dropIfExists('ai_insights');
    }
};
