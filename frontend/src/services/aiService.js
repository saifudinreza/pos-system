// ============================================================
// aiService.js, Layanan AI Assistant (powered by Groq + LLaMA)
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
//   GET  /api/ai/jobs/{id}     → polling hasil query (async job queue)
//   GET  /api/ai/logs          → riwayat pertanyaan ke AI + token yang dipakai
//   GET  /api/ai/usage-today   → sisa kuota AI user
//
// Sejak implementasi job queue, POST /ai/* langsung balas 202 + job id,
// LALU hasil AI dipoll via GET /ai/jobs/{id} sampai selesai. Wrapper di
// bawah menyembunyikan detail ini: dipanggil sekali dari aiStore dan
// mengembalikan bentuk respons yang SAMA seperti dulu (sinkron).
// ============================================================

import api from "@/lib/axios";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS  = 120000; // 2 menit, Groq bisa lambat saat rate limit

// --- POLL STATUS JOB AI ---
// Kirim POST /ai/* → dapat job_id → poll GET /ai/jobs/{id} sampai
// status "completed"/"failed". Balikan bentuk lama (response/tokens/provider).
const pollJob = async (jobId) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const { data } = await api.get(`/ai/jobs/${jobId}`);
    const job = data?.data ?? {};

    if (job.status === "completed") {
      return { ...(job.data ?? {}), _usage: job.usage };
    }

    if (job.status === "failed") {
      const err = new Error(job.error ?? "AI tidak dapat menjawab saat ini. Coba lagi.");
      // Buat err.response palsu berbentuk respons axios, supaya pemanggil
      // bisa memakai pola err.response?.data?.message seperti error biasa
      err.response = { data: { message: err.message } };
      throw err;
    }

    // pending / processing → tunggu lalu cek lagi
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  // Batas waktu polling tercapai, job masih belum selesai
  const err = new Error("AI membutuhkan waktu terlalu lama. Coba lagi.");
  err.response = { data: { message: err.message } };
  throw err;
};

const aiService = {

  // --- QUERY ANALISIS PENJUALAN ---
  // Kirim pertanyaan dalam bahasa natural → AI jawab berdasarkan data DB
  // @param {{ query: string }} payload, max 500 karakter
  // @returns {{ message, response: string, tokens_used: number }}
  query: async (query) => {
    const { data } = await api.post("/ai/query", { query });
    return pollJob(data.job_id);
  },

  // --- PREDIKSI KAPAN STOK HABIS ---
  // AI menganalisis kecepatan penjualan per produk lalu memperkirakan
  // kapan stok akan habis. Proses async, polling job di balik layar.
  // @param {{ query: string }} payload
  predictStock: async (query) => {
    const { data } = await api.post("/ai/predict-stock", { query });
    return pollJob(data.job_id);
  },

  // --- REKOMENDASI PRODUK / STRATEGI ---
  // Bisa spesifik ke satu produk (productId) atau umum untuk seluruh toko.
  // @param {string} query
  // @param {number|null} productId, ID produk spesifik (opsional)
  recommend: async (query, productId = null) => {
    const { data } = await api.post("/ai/recommend", { query, product_id: productId });
    return pollJob(data.job_id);
  },

  // --- LOG RIWAYAT QUERY AI ---
  getLogs: async () => {
    const { data } = await api.get("/ai/logs");
    return data;
  },

  // --- KUOTA CHAT HARI INI ---
  // @returns {{ used: number, remaining: number, limit: number, warning: boolean }}
  getUsageToday: async () => {
    const { data } = await api.get("/ai/usage-today");
    return data;
  },

  // --- STATS MONITORING (admin/developer) ---
  // @returns { summary, by_type, by_provider, users_today, daily_trend, config }
  getStats: async () => {
    const { data } = await api.get("/ai/stats");
    return data;
  },
};

export default aiService;