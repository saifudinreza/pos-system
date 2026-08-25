<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ============================================================
        // TABEL CUSTOMERS, enabler CRM & segmentation.
        // Selama ini pelanggan cuma berupa string `orders.customer_phone`;
        // sekarang jadi entitas nyata yang bisa diagregasi (total belanja,
        // frekuensi, kunjungan terakhir).
        // ============================================================
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();

            // Satu pelanggan per nomor HP per tenant
            $table->unique(['tenant_id', 'phone']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            // Index untuk pencarian riwayat per nomor HP (enabler CRM)
            $table->index(['tenant_id', 'customer_phone'], 'orders_tenant_phone_idx');
        });

        // ----- BACKFILL -----
        // Ambil semua nomor HP unik dari order yang sudah ada & jadikan
        // baris customers (nama belum diketahui → null, bisa diisi nanti).
        // insertOrIgnore aman untuk data lama yang nomornya duplikat.
        $now = now();
        $rows = DB::table('orders')
            ->select('tenant_id', 'customer_phone')
            ->distinct()
            ->whereNotNull('customer_phone')
            ->where('customer_phone', '!=', '')
            ->get();

        foreach ($rows as $row) {
            DB::table('customers')->insertOrIgnore([
                'tenant_id'  => $row->tenant_id,
                'phone'      => $row->customer_phone,
                'name'       => null,
                'notes'      => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_tenant_phone_idx');
            $table->dropConstrainedForeignId('customer_id');
        });
        Schema::dropIfExists('customers');
    }
};
