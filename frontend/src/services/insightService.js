// ============================================================
// insightService.js — Layanan Wawasan AI (AI Business Insight)
//
// Analogi: "analis bisnis otomatis" yang membaca angka toko lalu
// merangkainya jadi kalimat yang mudah dipahami.
//
// Relasi ke Backend:
//   GET  /api/insights           → insight terakhir yang tersimpan
//   POST /api/insights/generate  → minta AI membuat ulang wawasan
// ============================================================

import api from "@/lib/axios";

const insightService = {
  // --- AMBIL WAWASAN TERSIMPAN ---
  // Hanya membaca insight terakhir dari database (TIDAK memanggil LLM)
  // @returns { data: { insight, created_at } }
  getInsights: async () => {
    const { data } = await api.get("/insights");
    return data;
  },

  // --- GENERATE WAWASAN BARU ---
  // Minta AI (Groq/OpenRouter) menulis ulang wawasan dari data terkini.
  // Dipanggil manual oleh admin — throttle 5 request/menit di backend.
  // @returns { data: { insight, ... } }
  generateInsights: async () => {
    const { data } = await api.post("/insights/generate");
    return data;
  },
};

export default insightService;
