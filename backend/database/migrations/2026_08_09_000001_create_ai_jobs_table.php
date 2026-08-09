<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Menyimpan status pekerjaan AI yang diproses secara async oleh
        // queue worker. Frontend mem-poll GET /api/ai/jobs/{id} sampai
        // status jadi "completed" / "failed".
        Schema::create('ai_jobs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('type'); // sales_analysis | stock_prediction | recommendation
            $table->text('query');
            $table->longText('prompt');
            $table->string('status')->default('pending')->index(); // pending | processing | completed | failed
            $table->text('response')->nullable();
            $table->integer('tokens_used')->nullable();
            $table->string('provider')->nullable();
            $table->string('model')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
            $table->timestamp('processed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_jobs');
    }
};