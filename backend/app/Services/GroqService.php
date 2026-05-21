<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key');
        $this->model  = config('services.groq.model', 'llama-3.3-70b-versatile');
    }

    public function ask(string $systemPrompt, string $userQuery): array
    {
        try {
            $response = Http::timeout(30)
                ->withToken($this->apiKey)
                ->post($this->baseUrl, [
                    'model'       => $this->model,
                    'messages'    => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user',   'content' => $userQuery],
                    ],
                    'max_tokens'  => 1024,
                    'temperature' => 0.7,
                ]);

            if (! $response->successful()) {
                Log::error('Groq API error', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                throw new \Exception('Groq API gagal: ' . $response->body());
            }

            $data = $response->json();

            return [
                'text'        => $data['choices'][0]['message']['content'] ?? 'Tidak ada response dari AI.',
                'tokens_used' => $data['usage']['total_tokens'] ?? 0,
            ];
        } catch (\Exception $e) {
            Log::error('GroqService error: ' . $e->getMessage());
            throw $e;
        }
    }

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
