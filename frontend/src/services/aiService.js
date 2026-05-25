// ============================================================
// aiService.js — Layanan AI Assistant (powered by Groq + LLaMA)
//
// Analogi: Ini seperti "konsultan bisnis pintar" yang selalu siap
// menjawab pertanyaan soal data toko kita. Dia membaca data
// penjualan dari database, lalu menjawab dalam bahasa manusia.
//
// Di balik layar, backend menggunakan:
//   - Groq API (model: llama-3.3-70b-versatile)
//   - Mengambil data relevan dari DB (penjualan, stok, dll)
//   - Lalu minta LLaMA menganalisis + menjawab dalam Bahasa Indonesia
//
// Relasi ke Backend:
//   POST /api/ai/query         → analisis penjualan (natural language)
//   POST /api/ai/predict-stock → prediksi kapan stok habis
//   POST /api/ai/recommend     → rekomendasi produk / strategi
//   GET  /api/ai/logs          → riwayat pertanyaan ke AI + token yang dipakai
//
// Semua endpoint butuh auth (token Bearer).
// Setiap query disimpan di tabel ai_query_logs.
//
// Limit query: backend mungkin menerapkan rate limiting
// ============================================================

import api from "@/lib/axios";

const aiService = {

  // --- QUERY ANALISIS PENJUALAN ---
  // Kirim pertanyaan dalam bahasa natural → AI jawab berdasarkan data DB
  // Analogi: tanya ke konsultan "Produk apa yang paling laris minggu ini?"
  //          dan konsultan langsung baca laporan penjualan untuk menjawab
  //
  // @param {{ query: string }} payload — max 500 karakter
  // @returns {{ message, response: string, tokens_used: number }}
  query: async (query) => {
    const { data } = await api.post("/ai/query", { query });
    return data;
  },

  // --- PREDIKSI STOK ---
  // Analogi: konsultan memperkirakan kapan stok barang akan habis
  // berdasarkan tren penjualan historis
  //
  // @param {{ query: string }} — misal: "Kapan stok Ayam Geprek akan habis?"
  // @returns {{ message, response: string, tokens_used: number }}
  predictStock: async (query) => {
    const { data } = await api.post("/ai/predict-stock", { query });
    return data;
  },

  // --- REKOMENDASI PRODUK / STRATEGI ---
  // Analogi: konsultan memberi saran "Produk apa yang perlu di-restock?"
  // atau "Bagaimana cara meningkatkan penjualan Es Teh?"
  //
  // @param {{ query: string }}
  // @returns {{ message, response: string, tokens_used: number }}
  recommend: async (query) => {
    const { data } = await api.post("/ai/recommend", { query });
    return data;
  },

  // --- LOG RIWAYAT QUERY AI ---
  // Menampilkan semua pertanyaan yang pernah diajukan ke AI
  // beserta jawaban dan jumlah token yang terpakai (untuk monitoring biaya)
  // Analogi: buku catatan semua konsultasi yang pernah dilakukan
  //
  // @returns AiQueryLog[] — field: type, query, response, tokens_used, created_at
  getLogs: async () => {
    const { data } = await api.get("/ai/logs");
    return data;
  },
};

export default aiService;
