<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite tidak mendukung ALTER ... MODIFY. Karena kolom role sudah ada,
        // dan SQLite tidak mengenforce ENUM constraint, migration ini cukup
        // jadi no-op di sqlite (test/development). Di MySQL, ubah enum-nya.
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('users', function ($table) {
                // no-op — kolom role sudah ada dari migration awal
            });
            return;
        }

        DB::statement("ALTER TABLE users MODIFY role ENUM('admin','kasir','user','developer') NOT NULL DEFAULT 'user'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE users MODIFY role ENUM('admin','kasir','user') NOT NULL DEFAULT 'user'");
    }
};
