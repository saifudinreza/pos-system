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
  // Ambil insight yang sudah tersimpan (tidak memanggil LLM)
  getInsights: async () => {
    const { data } = await api.get("/insights");
    return data;
  },

  // Minta AI membuat wawasan baru (memanggil LLM → terbatas 5x/menit)
  generateInsights: async () => {
    const { data } = await api.post("/insights/generate");
    return data;
  },
};

export default insightService;
