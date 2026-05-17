<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    public function ask(string $prompt): array
    {
        $response = Http::timeout(30)->post($this->apiUrl . '?key=' . config('services.gemini.key'), [
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ],
            'generationConfig' => [
                'maxOutputTokens' => 1024,
                'temperature' => 0.7,
            ],
        ]);

        if ($response->failed()) {
            Log::error('Gemini API error', ['body' => $response->body()]);
            throw new \Exception('Gagal menghubungi Gemini API.');
        }

        $data = $response->json();

        return [
            'text'   => $data['candidates'][0]['content']['parts'][0]['text'] ?? 'Tidak ada respons.',
            'tokens' => $data['usageMetadata']['totalTokenCount'] ?? 0,
        ];
    }
}
