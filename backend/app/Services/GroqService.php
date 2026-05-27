<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    private const GROQ_RATE_LIMIT_KEY = 'groq_rate_limited';
    private const GROQ_RATE_LIMIT_TTL = 65; // detik — sedikit lebih dari reset window Groq (60s)

    private string $groqKey;
    private string $groqModel;
    private string $groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

    private string $orKey;
    private string $orModel;
    private string $orUrl;

    public function __construct()
    {
        $this->groqKey   = config('services.groq.api_key');
        $this->groqModel = config('services.groq.model', 'llama-3.3-70b-versatile');

        $this->orKey   = config('services.openrouter.api_key');
        $this->orModel = config('services.openrouter.model', 'meta-llama/llama-3.1-8b-instruct:free');
        $this->orUrl   = config('services.openrouter.base_url', 'https://openrouter.ai/api/v1/chat/completions');
    }

    // ============================================================
    // ask() — kirim ke Groq dulu, auto-fallback ke OpenRouter
    //          jika Groq rate-limited (429). Setelah TTL habis
    //          (65 detik), otomatis kembali ke Groq.
    // ============================================================
    public function ask(string $systemPrompt, string $userQuery): array
    {
        $groqRateLimited = Cache::get(self::GROQ_RATE_LIMIT_KEY, false);

        if (! $groqRateLimited) {
            try {
                return $this->callGroq($systemPrompt, $userQuery);
            } catch (\Exception $e) {
                // Kalau 429 (rate limit) → tandai dan langsung coba OpenRouter
                if ($this->isRateLimitError($e)) {
                    Log::warning('Groq rate limit hit — switching to OpenRouter for ' . self::GROQ_RATE_LIMIT_TTL . 's');
                    Cache::put(self::GROQ_RATE_LIMIT_KEY, true, self::GROQ_RATE_LIMIT_TTL);
                    return $this->callOpenRouter($systemPrompt, $userQuery);
                }
                throw $e;
            }
        }

        // Groq sedang rate-limited → pakai OpenRouter
        Log::info('Groq masih rate-limited, menggunakan OpenRouter');
        return $this->callOpenRouter($systemPrompt, $userQuery);
    }

    // ============================================================
    // Provider info — untuk ditampilkan di frontend
    // ============================================================
    public function getActiveProvider(): string
    {
        return Cache::get(self::GROQ_RATE_LIMIT_KEY, false) ? 'openrouter' : 'groq';
    }

    public function getActiveModel(): string
    {
        return Cache::get(self::GROQ_RATE_LIMIT_KEY, false) ? $this->orModel : $this->groqModel;
    }

    // ============================================================
    // PRIVATE — call Groq
    // ============================================================
    private function callGroq(string $systemPrompt, string $userQuery): array
    {
        $response = Http::timeout(30)
            ->withToken($this->groqKey)
            ->post($this->groqUrl, [
                'model'       => $this->groqModel,
                'messages'    => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user',   'content' => $userQuery],
                ],
                'max_tokens'  => 1024,
                'temperature' => 0.7,
            ]);

        if (! $response->successful()) {
            Log::error('Groq API error', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \Exception('groq_error:' . $response->status() . ':' . $response->body());
        }

        $data = $response->json();

        return [
            'text'        => $data['choices'][0]['message']['content'] ?? 'Tidak ada response dari AI.',
            'tokens_used' => $data['usage']['total_tokens'] ?? 0,
            'provider'    => 'groq',
            'model'       => $this->groqModel,
        ];
    }

    // ============================================================
    // PRIVATE — call OpenRouter
    // ============================================================
    private function callOpenRouter(string $systemPrompt, string $userQuery): array
    {
        if (empty($this->orKey)) {
            throw new \Exception('OpenRouter API key belum dikonfigurasi.');
        }

        $response = Http::timeout(30)
            ->withToken($this->orKey)
            ->withHeaders([
                'HTTP-Referer' => config('app.url', 'http://localhost'),
                'X-Title'      => config('app.name', 'KasirAI'),
            ])
            ->post($this->orUrl, [
                'model'       => $this->orModel,
                'messages'    => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user',   'content' => $userQuery],
                ],
                'max_tokens'  => 1024,
                'temperature' => 0.7,
            ]);

        if (! $response->successful()) {
            Log::error('OpenRouter API error', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \Exception('OpenRouter gagal: ' . $response->body());
        }

        $data = $response->json();

        return [
            'text'        => $data['choices'][0]['message']['content'] ?? 'Tidak ada response dari AI.',
            'tokens_used' => $data['usage']['total_tokens'] ?? 0,
            'provider'    => 'openrouter',
            'model'       => $this->orModel,
        ];
    }

    // ============================================================
    // PRIVATE — deteksi apakah error adalah rate limit
    // ============================================================
    private function isRateLimitError(\Exception $e): bool
    {
        $msg = $e->getMessage();
        return str_contains($msg, 'groq_error:429') || str_contains($msg, 'rate_limit_exceeded');
    }

    // ============================================================
    // PROMPT BUILDERS (tidak berubah)
    // ============================================================
    public function buildSalesPrompt(array $salesData, string $userQuery): string
    {
        $dataJson = json_encode($salesData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return "Kamu adalah asisten analisis penjualan untuk sistem POS (Point of Sale).
Tugasmu adalah menganalisis data penjualan dan menjawab pertanyaan dalam Bahasa Indonesia yang mudah dipahami.
Selalu berikan jawaban yang ringkas, jelas, dan actionable.
Jangan tampilkan data mentah JSON, tapi rangkum dalam kalimat yang natural.

Data penjualan yang tersedia:
{$dataJson}

Jawab pertanyaan berikut berdasarkan data di atas.
Kalau data tidak cukup untuk menjawab, katakan dengan jujur.";
    }

    public function buildStockPrompt(array $stockData, string $userQuery): string
    {
        $dataJson = json_encode($stockData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return "Kamu adalah asisten manajemen stok untuk sistem POS (Point of Sale).
Tugasmu adalah menganalisis data stok dan memberikan prediksi serta rekomendasi restok.
Jawab dalam Bahasa Indonesia yang mudah dipahami oleh pemilik toko.
Berikan estimasi kapan stok habis berdasarkan rata-rata penjualan harian.
Berikan rekomendasi yang konkret dan actionable.

ATURAN PENTING:
- Kalau rata_per_hari kurang dari 1, artinya penjualan masih sangat sedikit
  dan estimasi hari tidak perlu disebutkan karena tidak relevan
- Fokus analisis pada produk yang statusnya MENIPIS
- Kalau semua produk masih Normal dan data penjualan sedikit,
  sampaikan bahwa stok masih aman dan sarankan tunggu data lebih banyak

Data stok dan histori penjualan:
{$dataJson}

Jawab pertanyaan berikut dan berikan rekomendasi yang konkret.";
    }

    public function buildRecommendationPrompt(array $transactionData, string $userQuery): string
    {
        $dataJson = json_encode($transactionData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        return "Kamu adalah asisten rekomendasi produk untuk sistem POS (Point of Sale).
Tugasmu adalah menganalisis pola pembelian pelanggan dan memberikan rekomendasi produk yang sering dibeli bersamaan.
Jawab dalam Bahasa Indonesia yang natural dan actionable untuk kasir.
Fokus pada produk yang paling sering dibeli bersamaan (cross-selling).

Data pola transaksi:
{$dataJson}

Berikan rekomendasi produk yang relevan berdasarkan data di atas.";
    }
}
