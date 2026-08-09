<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============================================================
        // AUDIT LOG — jejak perubahan data penting (produk, harga, role,
        // plan, setting tenant). Selama ini tidak ada sama sekali:
        // kalau harga produk berubah, tidak ada yang tahu siapa & kapan.
        // ============================================================
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');               // created | updated | deleted | role_changed | plan_changed ...
            $table->string('entity_type')->nullable(); // product | user | subscription | tenant | shift ...
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('before')->nullable();     // snapshot nilai lama
            $table->json('after')->nullable();      // snapshot nilai baru
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'created_at'], 'audit_tenant_date_idx');
            $table->index(['entity_type', 'entity_id'], 'audit_entity_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
