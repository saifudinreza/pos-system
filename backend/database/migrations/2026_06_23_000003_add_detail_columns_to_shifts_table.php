<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            // ----- BUKA SHIFT -----
            // Catatan tambahan saat buka (misal: penukaran uang receh)
            $table->text('opening_note')->nullable()->after('opening_balance');
            // Rincian pecahan uang laci saat buka { "100000": 2, "50000": 5, ... }
            $table->json('opening_denominations')->nullable()->after('opening_note');

            // ----- TUTUP SHIFT -----
            // Rincian pecahan uang fisik saat tutup
            $table->json('closing_denominations')->nullable()->after('closing_balance');
            // Pengeluaran kas kecil (petty cash) selama shift
            $table->decimal('petty_cash', 12, 2)->default(0)->after('closing_denominations');
            $table->text('petty_cash_note')->nullable()->after('petty_cash');
            // Otorisasi: nama supervisor/manajer yang memverifikasi (opsional)
            $table->string('verified_by', 100)->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn([
                'opening_note',
                'opening_denominations',
                'closing_denominations',
                'petty_cash',
                'petty_cash_note',
                'verified_by',
            ]);
        });
    }
};
