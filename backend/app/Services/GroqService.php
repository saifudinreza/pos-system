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

    private ?string $orKey;
    private ?string $orModel;
    private ?string $orUrl;

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
    // PROMPT BUILDERS
    // ============================================================

    private function baseSystemPrompt(string $storeDataSection): string
    {
        return "You are KasirAI Assistant, a smart business helper for small to medium retail and cashier businesses. You have access to this store's sales data, product catalog, transaction history, and business reports.

You can help with:
- Sales analysis and insights from the store's data
- Product recommendations and stock suggestions
- Business tips for retail/cashier businesses
- Calculating profits, margins, and revenue trends
- Answering questions about business operations, customer behavior, and pricing strategy
- General business advice relevant to small retail owners
- Helping interpret reports and numbers

Always answer in Bahasa Indonesia that is easy to understand for a small business owner.
Keep answers concise, clear, and actionable. Never show raw JSON data — summarize in natural sentences.
If asked something completely unrelated to business, kindly redirect the user.
If the data is not sufficient to answer, say so honestly.

Store data context:
{$storeDataSection}";
    }

    public function buildSalesPrompt(array $salesData): string
    {
        $dataJson = json_encode($salesData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return $this->baseSystemPrompt($dataJson);
    }

    public function buildStockPrompt(array $stockData): string
    {
        $dataJson = json_encode($stockData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $extra = "\n\nATURAN TAMBAHAN UNTUK ANALISIS STOK:
- Kalau rata_per_hari kurang dari 1, penjualan masih sangat sedikit dan estimasi hari tidak perlu disebutkan
- Fokus analisis pada produk yang statusnya MENIPIS
- Kalau semua produk masih Normal, sampaikan stok aman dan sarankan pantau terus";

        return $this->baseSystemPrompt($dataJson . $extra);
    }

    public function buildRecommendationPrompt(array $transactionData): string
    {
        $dataJson = json_encode($transactionData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $extra = "\n\nFokus pada produk yang paling sering dibeli bersamaan (cross-selling opportunity).";

        return $this->baseSystemPrompt($dataJson . $extra);
    }
}
