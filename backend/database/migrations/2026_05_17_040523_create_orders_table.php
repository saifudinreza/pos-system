<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {

            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // ↑ Siapa yang buat order ini — bisa customer atau kasir
            // Kalau user dihapus, order ikut terhapus (cascadeOnDelete)

            $table->string('order_number')->unique();
            // ↑ Nomor order yang tampil ke customer, contoh: "ORD-20250517-0001"
            // Dibuat otomatis di OrderController saat order dibuat
            // unique() = tidak mungkin ada 2 order dengan nomor sama

            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending');
            // ↑ Status alur order:
            // pending  = order dibuat, belum bayar
            // paid     = sudah bayar (diupdate saat webhook Midtrans masuk)
            // cancelled = dibatalkan, stok dikembalikan

            $table->decimal('subtotal', 12, 2)->default(0);
            // ↑ Total harga produk sebelum pajak
            // Dihitung dari SUM(order_items.subtotal)

            $table->decimal('tax', 12, 2)->default(0);
            // ↑ Pajak, contoh: PPN 11% dari subtotal

            $table->decimal('total', 12, 2)->default(0);
            // ↑ Yang dibayar customer = subtotal + tax

            $table->text('notes')->nullable();
            // ↑ Catatan tambahan dari customer/kasir, boleh kosong

            $table->timestamps();

            $table->index('status');
            // ↑ Sering difilter: WHERE status = 'paid'

            $table->index('created_at');
            // ↑ Sering difilter by tanggal untuk laporan harian/bulanan
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};