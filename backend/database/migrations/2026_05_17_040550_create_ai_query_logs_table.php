<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_query_logs', function (Blueprint $table) {

            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // ↑ Siapa yang nanya ke AI
            // Untuk audit: admin mana yang sering pakai fitur AI

            $table->enum('type', [
                'sales_analysis',    // "produk apa yang paling laku?"
                'stock_prediction',  // "kapan stok Indomie habis?"
                'recommendation'     // "produk apa yang cocok disarankan?"
            ]);
            // ↑ Kategori pertanyaan AI
            // Berguna untuk analisis: fitur AI mana yang paling sering dipakai

            $table->text('query');
            // ↑ Pertanyaan asli dari user yang diketik di chat widget
            // Contoh: "tampilkan 5 produk terlaris bulan ini"

            $table->text('response');
            // ↑ Jawaban yang dikembalikan Claude API
            // Disimpan supaya tidak perlu query ulang untuk pertanyaan yang sama

            $table->integer('tokens_used')->default(0);
            // ↑ Berapa token Claude yang terpakai untuk menjawab pertanyaan ini
            // Penting untuk monitoring biaya API Claude
            // Claude API charge berdasarkan jumlah token

            $table->timestamps();

            $table->index('type');
            // ↑ Filter log berdasarkan tipe query

            $table->index('created_at');
            // ↑ Filter log berdasarkan tanggal untuk monitoring penggunaan AI
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_query_logs');
    }
};