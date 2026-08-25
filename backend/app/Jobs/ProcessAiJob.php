<?php

namespace App\Jobs;

use App\Models\AiJob;
use App\Models\AiQueryLog;
use App\Services\GroqService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Menjalankan panggilan LLM secara async. Prompt sudah dibangun di controller
 * (dalam konteks auth, isolasi tenant aman), jadi job ini TIDAK menyentuh
 * database tenant sama sekali, hanya memanggil GroqService::ask lalu menulis
 * hasilnya kembali ke baris `ai_jobs` sebagai respons yang dipoll frontend.
 */
class ProcessAiJob implements ShouldQueue
{
    use Queueable;

    /** Jumlah maksimal percobaan eksekusi job (retry otomatis oleh queue). */
    public int $tries = 2;
    /** Batas waktu eksekusi per percobaan (detik), LLM butuh waktu. */
    public int $timeout = 90;

    /** ID baris ai_jobs yang akan diproses oleh worker. */
    private int $aiJobId;

    /**
     * @param int $aiJobId ID baris di tabel `ai_jobs` (dibuat oleh AiController)
     */
    public function __construct(int $aiJobId)
    {
        $this->aiJobId = $aiJobId;
    }

    /**
     * Eksekusi utama job: panggil LLM, simpan hasil/error ke baris ai_jobs,
     * dan tulis log query AI.
     */
    public function handle(GroqService $groq): void
    {
        $job = AiJob::find($this->aiJobId);

        // Job sudah terhapus (mis. dibersihkan) → tidak ada yang diproses
        if (! $job) {
            return;
        }

        // Tandai sedang diproses supaya frontend (polling) tahu statusnya
        $job->update(['status' => 'processing', 'processed_at' => now()]);

        try {
            $result = $groq->ask($job->prompt, $job->query);

            // Simpan hasil LLM ke baris job, frontend mem-poll status ini
            $job->update([
                'status'      => 'completed',
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'] ?? 0,
                'provider'    => $result['provider'] ?? null,
                'model'       => $result['model'] ?? null,
                'processed_at' => now(),
            ]);

            // Simpan log query, dipindah ke job supaya reliable walau
            // response dikirim async (jika request owner sudah pergi).
            AiQueryLog::create([
                'user_id'     => $job->user_id,
                'type'        => $job->type,
                'query'       => $job->query,
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'] ?? 0,
                'provider'    => $result['provider'] ?? null,
            ]);

        } catch (\Throwable $e) {
            Log::error('AI job gagal', [
                'ai_job_id' => $job->id,
                'message'   => $e->getMessage(),
            ]);

            // Simpan pesan error di baris job agar frontend bisa menampilkannya
            $job->update([
                'status'       => 'failed',
                'error'        => $e->getMessage(),
                'processed_at' => now(),
            ]);
        }
    }

    /**
     * Dipanggil saat job gagal permanen (retry habis).
     * Error LLM sederhana ditangani di handle(), di sini cukup dicatat di log.
     */
    public function failed(\Throwable $e): void
    {
        Log::error('AI job failed permanently', [
            'ai_job_id' => $this->aiJobId,
            'message'   => $e->getMessage(),
        ]);
    }
}