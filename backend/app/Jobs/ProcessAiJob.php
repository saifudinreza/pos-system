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
 * (dalam konteks auth — isolasi tenant aman), jadi job ini TIDAK menyentuh
 * database tenant sama sekali, hanya memanggil GroqService::ask lalu menulis
 * hasilnya kembali ke baris `ai_jobs` sebagai respons yang dipoll frontend.
 */
class ProcessAiJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;
    public int $timeout = 90;

    private int $aiJobId;

    public function __construct(int $aiJobId)
    {
        $this->aiJobId = $aiJobId;
    }

    public function handle(GroqService $groq): void
    {
        $job = AiJob::find($this->aiJobId);

        if (! $job) {
            return;
        }

        $job->update(['status' => 'processing', 'processed_at' => now()]);

        try {
            $result = $groq->ask($job->prompt, $job->query);

            $job->update([
                'status'      => 'completed',
                'response'    => $result['text'],
                'tokens_used' => $result['tokens_used'] ?? 0,
                'provider'    => $result['provider'] ?? null,
                'model'       => $result['model'] ?? null,
                'processed_at' => now(),
            ]);

            // Simpan log query — dipindah ke job supaya reliable walau
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

            $job->update([
                'status'       => 'failed',
                'error'        => $e->getMessage(),
                'processed_at' => now(),
            ]);
        }
    }

    /** Sukses job tidak perlu di-retry penuh untuk error LLM sederhana. */
    public function failed(\Throwable $e): void
    {
        Log::error('AI job failed permanently', [
            'ai_job_id' => $this->aiJobId,
            'message'   => $e->getMessage(),
        ]);
    }
}