<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {

            $table->id();

            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            // ↑ Transaksi ini milik order mana
            // Relasi one-to-one: satu order punya tepat satu transaksi pembayaran

            $table->string('midtrans_order_id')->unique();
            // ↑ ID yang kita kirim ke Midtrans saat request pembayaran
            // Biasanya sama dengan order_number, contoh: "ORD-20250517-0001"
            // unique() = tidak boleh kirim ID yang sama 2x ke Midtrans

            $table->string('midtrans_transaction_id')->nullable();
            // ↑ ID yang Midtrans berikan balik setelah pembayaran sukses
            // nullable karena baru ada setelah customer selesai bayar
            // Contoh: "2312345678" dari response Midtrans

            $table->enum('payment_method', [
                'qris',
                'bank_transfer',
                'credit_card',
                'gopay',
                'ovo',
                'cash'
            ])->nullable();
            // ↑ Metode bayar yang dipilih customer
            // nullable karena baru ketahuan setelah customer pilih di popup Midtrans
            // 'cash' untuk transaksi langsung di kasir tanpa Midtrans

            $table->enum('status', [
                'pending',      // belum bayar
                'settlement',   // bayar sukses (istilah dari Midtrans)
                'expire',       // waktu bayar habis
                'cancel',       // dibatalkan
                'deny'          // ditolak bank/kartu
            ])->default('pending');
            // ↑ Status ini diupdate otomatis saat webhook dari Midtrans masuk
            // Kamu tidak perlu update manual, Midtrans yang kirim notifikasi

            $table->decimal('amount', 12, 2);
            // ↑ Jumlah yang harus dibayar, sama dengan orders.total

            $table->string('snap_token')->nullable();
            // ↑ Token dari Midtrans Snap untuk buka popup pembayaran di frontend
            // Frontend pakai token ini untuk tampilkan halaman bayar Midtrans
            // Expire dalam 24 jam, nullable karena dibuat setelah order

            $table->timestamp('paid_at')->nullable();
            // ↑ Kapan transaksi sukses dibayar
            // Diisi saat webhook Midtrans masuk dengan status 'settlement'
            // nullable karena belum tentu sudah bayar

            $table->json('midtrans_response')->nullable();
            // ↑ Simpan RAW response dari Midtrans sebagai JSON
            // Berguna untuk debug kalau ada masalah pembayaran
            // Contoh isi: {"transaction_status":"settlement","fraud_status":"accept",...}

            $table->timestamps();

            $table->index('status');
            // ↑ Sering difilter: WHERE status = 'settlement' untuk laporan

            $table->index('paid_at');
            // ↑ Sering difilter by tanggal: laporan pembayaran harian/bulanan
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};