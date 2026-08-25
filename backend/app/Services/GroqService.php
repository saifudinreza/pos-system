<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Klien AI dual-provider: Groq (utama) → OpenRouter (fallback).
 *
 * Semua panggilan LLM lewat `ask()`. Kalau Groq kena rate limit (HTTP 429),
 * flag `groq_rate_limited` diset di cache selama 65 detik dan request
 * berikutnya otomatis dialihkan ke OpenRouter. Setelah TTL habis, otomatis
 * kembali mencoba Groq lagi. Service ini juga menyusun prompt sistem untuk
 * tiap jenis pertanyaan (penjualan, stok, rekomendasi).
 */
class GroqService
{
    // Kunci cache penanda Groq sedang rate-limited, dipakai juga oleh
    // getActiveProvider()/getActiveModel() untuk info provider aktif.
    private const GROQ_RATE_LIMIT_KEY = 'groq_rate_limited';
    // Durasi cooldown fallback ke OpenRouter, 65 detik, sedikit di atas
    // reset window rate limit Groq (60 detik) supaya tidak langsung kena lagi.
    private const GROQ_RATE_LIMIT_TTL = 65;

    private string $groqKey;
    private string $groqModel;
    private string $groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

    private ?string $orKey;
    private ?string $orModel;
    private ?string $orUrl;

    /**
     * Baca konfigurasi API dari config/services.php saat service di-resolve.
     * Key + model Groq dan OpenRouter dibaca di sini sekali, bukan per request.
     */
    public function __construct()
    {
        $this->groqKey   = config('services.groq.api_key');
        $this->groqModel = config('services.groq.model', 'llama-3.3-70b-versatile');

        $this->orKey   = config('services.openrouter.api_key');
        $this->orModel = config('services.openrouter.model', 'meta-llama/llama-3.1-8b-instruct:free');
        $this->orUrl   = config('services.openrouter.base_url', 'https://openrouter.ai/api/v1/chat/completions');
    }

    // ============================================================
    // ask(), kirim ke Groq dulu, auto-fallback ke OpenRouter
    //          jika Groq rate-limited (429). Setelah TTL habis
    //          (65 detik), otomatis kembali ke Groq.
    // ============================================================
    /**
     * Kirim prompt ke LLM dengan urutan provider: Groq → OpenRouter.
     *
     * Alur fallback:
     * 1. Flag cooldown belum aktif → coba Groq dulu.
     * 2. Groq gagal dengan error APA PUN (429 rate limit, 404 model tidak
     *    ditemukan, 401 key invalid, timeout, dll) → langsung fallback ke
     *    OpenRouter (kalau dikonfigurasi) dan set cooldown singkat supaya
     *    tidak terus menembak Groq yang bermasalah.
     * 3. Flag cooldown masih aktif → langsung OpenRouter; kalau OpenRouter
     *    tidak dikonfigurasi → reset flag & coba Groq lagi.
     *
     * @param string $systemPrompt Prompt sistem (konteks toko/data)
     * @param string $userQuery    Pertanyaan/pesan dari user
     * @return array{text: string, tokens_used: int, provider: string, model: string}
     */
    public function ask(string $systemPrompt, string $userQuery): array
    {
        // Cek flag cooldown dari cache (false = Groq normal)
        $groqRateLimited = Cache::get(self::GROQ_RATE_LIMIT_KEY, false);

        if (! $groqRateLimited) {
            try {
                return $this->callGroq($systemPrompt, $userQuery);
            } catch (\Exception $e) {
                // Fallback ke OpenRouter pada error Groq APA PUN, bukan cuma 429.
                // Ini menangani kasus model Groq deprecated/invalid atau key bermasalah
                // di suatu environment, sehingga AI tetap jalan lewat OpenRouter.
                if (! empty($this->orKey)) {
                    Log::warning('Groq gagal (' . $e->getMessage() . '), fallback ke OpenRouter');
                    Cache::put(self::GROQ_RATE_LIMIT_KEY, true, self::GROQ_RATE_LIMIT_TTL);
                    return $this->callOpenRouter($systemPrompt, $userQuery);
                }
                // Tanpa OpenRouter tidak ada alternatif, biarkan error naik ke pemanggil
                throw $e;
            }
        }

        // Groq sedang dalam cooldown → pakai OpenRouter jika tersedia
        Log::info('Groq tidak aktif/cooldown, menggunakan OpenRouter');
        if (! empty($this->orKey)) {
            return $this->callOpenRouter($systemPrompt, $userQuery);
        }
        // OpenRouter tidak ada → reset cooldown & coba Groq lagi sekarang
        Cache::forget(self::GROQ_RATE_LIMIT_KEY);
        return $this->callGroq($systemPrompt, $userQuery);
    }

    /**
     * Provider yang sedang aktif dipakai (info untuk frontend).
     * Mengembalikan 'openrouter' kalau flag cooldown Groq masih aktif.
     */
    public function getActiveProvider(): string
    {
        return Cache::get(self::GROQ_RATE_LIMIT_KEY, false) ? 'openrouter' : 'groq';
    }

    /**
     * Nama model aktif: model OpenRouter saat cooldown, model Groq kalau normal.
     */
    public function getActiveModel(): string
    {
        return Cache::get(self::GROQ_RATE_LIMIT_KEY, false) ? $this->orModel : $this->groqModel;
    }

    // ============================================================
    // PRIVATE, call Groq
    // ============================================================
    /**
     * Panggil Groq API (chat completions).
     *
     * @throws \Exception Pesan error berformat `groq_error:{status}:{body}`
     *                    supaya isRateLimitError() bisa mendeteksi 429.
     */
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

        // Status selain 2xx → lempar error berisi status & body (dipakai deteksi 429)
        if (! $response->successful()) {
            Log::error('Groq API error', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \Exception('groq_error:' . $response->status() . ':' . $response->body());
        }

        // Bungkus hasil ke format seragam untuk pemanggil
        $data = $response->json();

        return [
            'text'        => $data['choices'][0]['message']['content'] ?? 'Tidak ada response dari AI.',
            'tokens_used' => $data['usage']['total_tokens'] ?? 0,
            'provider'    => 'groq',
            'model'       => $this->groqModel,
        ];
    }

    // ============================================================
    // PRIVATE, call OpenRouter
    // ============================================================
    /**
     * Panggil OpenRouter API (chat completions) sebagai fallback.
     *
     * @throws \Exception Kalau API key belum dikonfigurasi atau API error.
     */
    private function callOpenRouter(string $systemPrompt, string $userQuery): array
    {
        if (empty($this->orKey)) {
            throw new \Exception('OpenRouter API key belum dikonfigurasi.');
        }

        $response = Http::timeout(30)
            ->withToken($this->orKey)
            // Header identitas aplikasi, diminta OpenRouter untuk source tracking
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
    // PRIVATE, deteksi apakah error adalah rate limit
    // ============================================================
    /**
     * Deteksi apakah error berasal dari rate limit Groq (HTTP 429).
     * Memeriksa prefix error kustom `groq_error:429` (dari callGroq) atau
     * pesan `rate_limit_exceeded` dari respon OpenAI-compatible.
     */
    private function isRateLimitError(\Exception $e): bool
    {
        $message = $e->getMessage();
        return str_contains($message, 'groq_error:429') || str_contains($message, 'rate_limit_exceeded');
    }

    // ============================================================
    // PROMPT BUILDERS
    // ============================================================

    /**
     * Template prompt sistem dasar yang sama untuk semua jenis prompt AI.
     * `$storeDataSection` (JSON data toko) disisipkan ke bagian
     * "Store data context".
     */
    private function baseSystemPrompt(string $storeDataSection): string
    {
        // Sisipkan data toko (JSON) ke template prompt dasar
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
Keep answers concise, clear, and actionable. Never show raw JSON data, summarize in natural sentences.
For any ranked or listed data (best products, low stock, recommendations), present it as a compact markdown table (maximum 5 rows) or a numbered list, never as raw pipe text. Open with a short friendly headline and close with one brief insight or conclusion sentence.
If asked something completely unrelated to business, kindly redirect the user.
If the data is not sufficient to answer, say so honestly.

Store data context:
{$storeDataSection}";
    }

    /**
     * Prompt untuk chat analisis penjualan, berisi data 3 periode
     * (hari_ini/minggu_ini/bulan_ini) + katalog & stok produk, plus aturan
     * wajib soal periode waktu supaya LLM tidak salah label periode.
     */
    public function buildSalesPrompt(array $salesData): string
    {
        // ----- Bagian prompt: data penjualan 3 periode + katalog & stok produk (JSON) -----
        $dataJson = json_encode($salesData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        // ----- Bagian prompt: aturan wajib periode waktu & aturan stok/katalog -----
        $extra = "\n\nATURAN WAJIB SOAL PERIODE WAKTU:
- Data \"penjualan_per_periode\" berisi 3 rentang: hari_ini, minggu_ini, bulan_ini, masing-masing sudah dihitung terpisah dan akurat.
- Cocokkan periode yang dipakai jawaban PERSIS dengan kata yang diucapkan user: \"hari ini\"/\"hari ini juga\" → pakai hari_ini. \"minggu ini\" → pakai minggu_ini. \"bulan ini\" → pakai bulan_ini.
- Sebutkan nama periode HANYA SEKALI di kalimat pembuka (misal \"Berikut produk terlaris bulan ini:\"). JANGAN mengulang kata periode yang sama di dalam tabel atau kalimat berikutnya, dan JANGAN menulis format seperti \"(bulan ini)\" dua kali.

ATURAN FORMAT & GAYA JAWABAN (SANGAT PENTING):
- Buka dengan SATU kalimat headline ramah yang menyebut periode sekali saja.
- Tampilkan maksimal 5 produk teratas dalam tabel markdown dengan kolom: Nama Produk | Terjual | Pendapatan. JANGAN sertakan kolom SKU.
- Kalau produk terlaris lebih dari 5, tulis kalimat pendek \"dan N produk lainnya.\" setelah tabel.
- Tutup dengan SATU kalimat kesimpulan atau insight singkat yang berguna (misal menyebut produk andalan atau saran pantau stok).
- Jaga jawaban padat, rapi, dan langsung terbaca. Bahasa Indonesia.

ATURAN SOAL STOK & KATALOG PRODUK:
- \"katalog_dan_stok_produk\" berisi semua produk aktif toko ini beserta harga, kategori, stok, dan status (Normal/MENIPIS).
- Gunakan data ini untuk jawab pertanyaan soal stok, harga, atau detail produk tertentu, jangan bilang tidak ada data kalau informasinya sebenarnya ada di situ.
- Kalau ditanya \"stok apa yang mau habis\", filter & sebutkan hanya yang berstatus MENIPIS.";

        return $this->baseSystemPrompt($dataJson . $extra);
    }

    /**
     * Prompt untuk prediksi stok, data per produk (stok, rata penjualan
     * per hari, estimasi hari) dengan aturan analisis stok untuk LLM.
     */
    public function buildStockPrompt(array $stockData): string
    {
        // ----- Bagian prompt: data stok per produk (JSON) -----
        $dataJson = json_encode($stockData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        // ----- Bagian prompt: aturan tambahan analisis stok -----
        $extra = "\n\nATURAN TAMBAHAN UNTUK ANALISIS STOK:
- Kalau rata_per_hari kurang dari 1, penjualan masih sangat sedikit dan estimasi hari tidak perlu disebutkan
- Fokus analisis pada produk yang statusnya MENIPIS
- Kalau semua produk masih Normal, sampaikan stok aman dan sarankan pantau terus";

        return $this->baseSystemPrompt($dataJson . $extra);
    }

    /**
     * Prompt untuk rekomendasi produk, data transaksi (item yang sering
     * dibeli bersamaan) untuk analisis cross-selling.
     */
    public function buildRecommendationPrompt(array $transactionData): string
    {
        // ----- Bagian prompt: data transaksi (JSON) -----
        $dataJson = json_encode($transactionData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        // ----- Bagian prompt: arahan fokus cross-selling -----
        $extra = "\n\nFokus pada produk yang paling sering dibeli bersamaan (cross-selling opportunity).";

        return $this->baseSystemPrompt($dataJson . $extra);
    }
}
