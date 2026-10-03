<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Daftar semua akun berperan developer dan tandai yang bukan email resmi.
 * Hanya melaporkan, tidak mengubah data: user developer memiliki tenant_id null
 * (bypass TenantScope), jadi penurunan peran sebaiknya dilakukan sadar oleh owner.
 */
class DeveloperAudit extends Command
{
    protected $signature = 'kasirai:developer-audit';

    protected $description = 'Audit akun berperan developer (hanya email resmi yang sah).';

    public function handle(): int
    {
        $official = User::developerEmail();
        $developers = User::withoutGlobalScopes()->where('role', 'developer')->get();

        $this->info("Email developer resmi: {$official}");

        if ($developers->isEmpty()) {
            $this->warn('Tidak ada akun berperan developer sama sekali.');
            return self::SUCCESS;
        }

        $rows = $developers->map(fn (User $u) => [
            $u->id,
            $u->email,
            $u->is_active ? 'aktif' : 'nonaktif',
            User::isDeveloperEmail($u->email) ? 'SAH' : 'TIDAK SAH',
        ])->all();

        $this->table(['ID', 'Email', 'Status', 'Keabsahan'], $rows);

        $invalid = $developers->reject(fn (User $u) => User::isDeveloperEmail($u->email));

        if ($invalid->isNotEmpty()) {
            $this->error($invalid->count() . ' akun developer TIDAK SAH (terkunci oleh gerbang). Turunkan perannya lewat database/tinker.');
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
