// ============================================================
// aiStore.js — Global state untuk AI Assistant chat
//
// Analogi: Ini seperti "riwayat percakapan" di WhatsApp —
// menyimpan semua pesan (pertanyaan + jawaban) selama sesi ini,
// dan status apakah AI sedang "mengetik" (loading).
//
// AI Assistant ini terintegrasi dengan Groq (LLaMA) di backend.
// Setiap pertanyaan dikirim ke backend, backend query data DB,
// lalu minta LLaMA analisis + jawab → hasilnya tampil di chat.
//
// Relasi:
//   - aiStore → pakai aiService untuk kirim query ke backend
//   - aiStore → dibaca oleh AISidebar.jsx (panel chat di layout dashboard)
//
// Kuota AI:
//   - Paket FREE: 5 prompt/bulan (dihitung backend per bulan kalender)
//   - Paket Pro/Enterprise: tak terbatas (limit = null)
//
// Tipe query yang didukung backend:
//   "sales_analysis" → aiService.query()
//   "stock_prediction" → aiService.predictStock()
//   "recommendation" → aiService.recommend()
// ============================================================

import { create } from "zustand";
import aiService from "@/services/aiService";

// Format satu pesan di chat
// Analogi: seperti satu baris percakapan di WhatsApp
// { id, role: "user"|"assistant", content, timestamp, type?, tokens_used? }

const useAiStore = create((set) => ({
  // ============================================================
  // STATE
  // ============================================================

  // Array semua pesan di sesi ini
  // Dimulai dengan pesan selamat datang dari AI
  messages: [
    {
      id:        "welcome",
      role:      "assistant",
      content:   "Halo! Saya AI Assistant KasirAI. Tanya apa saja tentang bisnis kamu — penjualan, stok, tren produk, atau rekomendasi strategi. Saya siap membantu! 🤖",
      timestamp: new Date().toISOString(),
    },
  ],

  // Apakah AI sedang memproses (loading)
  // Saat true → tampilkan indikator "AI sedang mengetik..."
  isLoading: false,

  // Pesan error jika request gagal
  error: null,

  // Jumlah total token yang terpakai dalam sesi ini
  totalTokensUsed: 0,

  // Kuota AI (per bulan kalender; null = tak terbatas untuk Pro/Enterprise)
  dailyUsage: { used: 0, remaining: null, limit: null },
  limitReached: false,
  usageWarning: false,

  // ============================================================
  // ACTIONS
  // ============================================================

  // --- FETCH KUOTA AI ---
  fetchUsage: async () => {
    try {
      const data = await aiService.getUsageToday();
      set({
        dailyUsage:   data,
        limitReached: data.remaining === 0,
        usageWarning: data.warning === true,
      });
    } catch {}
  },

  // --- KIRIM PERTANYAAN KE AI (sales analysis) ---
  sendQuery: async (query) => {
    const userMessage = {
      id:        `user-${Date.now()}`,
      role:      "user",
      content:   query,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages:  [...state.messages, userMessage],
      isLoading: true,
      error:     null,
    }));

    try {
      const data = await aiService.query(query);

      const aiMessage = {
        id:          `ai-${Date.now()}`,
        role:        "assistant",
        content:     data.response,
        timestamp:   new Date().toISOString(),
        type:        "sales_analysis",
        tokens_used: data.tokens_used,
        provider:    data.provider,
        model:       data.model,
      };

      const usageUpdate = data._usage ?? null;
      set((state) => ({
        messages:        [...state.messages, aiMessage],
        isLoading:       false,
        totalTokensUsed: state.totalTokensUsed + (data.tokens_used ?? 0),
        dailyUsage: usageUpdate
          ? { used: usageUpdate.used, remaining: usageUpdate.remaining, limit: usageUpdate.limit }
          : {
              ...state.dailyUsage,
              used:      state.dailyUsage.used + 1,
              remaining: state.dailyUsage.limit === null ? null : Math.max(0, (state.dailyUsage.remaining ?? 0) - 1),
            },
        limitReached: usageUpdate ? usageUpdate.remaining === 0 : state.dailyUsage.remaining <= 1,
        usageWarning: usageUpdate ? (usageUpdate.warning === true) : false,
      }));

      return data;
    } catch (err) {
      const isLimit   = err.response?.data?.limit_reached === true;
      const errorMsg  = err.response?.data?.message ?? "AI tidak bisa menjawab saat ini. Coba lagi.";

      set((state) => ({
        messages: [
          ...state.messages,
          {
            id:        `err-${Date.now()}`,
            role:      "assistant",
            content:   `⚠️ ${errorMsg}`,
            timestamp: new Date().toISOString(),
            isError:   true,
          },
        ],
        isLoading:    false,
        error:        errorMsg,
        limitReached: isLimit ? true : state.limitReached,
      }));
      throw err;
    }
  },

  // --- PREDIKSI STOK ---
  // Kirim pertanyaan spesifik soal prediksi kehabisan stok
  predictStock: async (query) => {
    const userMessage = {
      id:        `user-${Date.now()}`,
      role:      "user",
      content:   query,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages:  [...state.messages, userMessage],
      isLoading: true,
      error:     null,
    }));

    try {
      const data = await aiService.predictStock(query);
      const aiMessage = {
        id:          `ai-${Date.now()}`,
        role:        "assistant",
        content:     data.response,
        timestamp:   new Date().toISOString(),
        type:        "stock_prediction",
        tokens_used: data.tokens_used,
        provider:    data.provider,
        model:       data.model,
      };
      const usageUpdateStock = data._usage ?? null;
      set((state) => ({
        messages:        [...state.messages, aiMessage],
        isLoading:       false,
        totalTokensUsed: state.totalTokensUsed + (data.tokens_used ?? 0),
        dailyUsage: usageUpdateStock
          ? { used: usageUpdateStock.used, remaining: usageUpdateStock.remaining, limit: usageUpdateStock.limit }
          : { ...state.dailyUsage, used: state.dailyUsage.used + 1, remaining: Math.max(0, state.dailyUsage.remaining - 1) },
        limitReached: usageUpdateStock ? usageUpdateStock.remaining === 0 : state.limitReached,
        usageWarning: usageUpdateStock ? (usageUpdateStock.warning === true) : state.usageWarning,
      }));
      return data;
    } catch (err) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id:        `err-${Date.now()}`,
            role:      "assistant",
            content:   "⚠️ Gagal memproses prediksi stok.",
            timestamp: new Date().toISOString(),
            isError:   true,
          },
        ],
        isLoading: false,
      }));
      throw err;
    }
  },

  // --- REKOMENDASI ---
  recommend: async (query) => {
    const userMessage = {
      id:        `user-${Date.now()}`,
      role:      "user",
      content:   query,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages:  [...state.messages, userMessage],
      isLoading: true,
      error:     null,
    }));

    try {
      const data = await aiService.recommend(query);
      const aiMessage = {
        id:          `ai-${Date.now()}`,
        role:        "assistant",
        content:     data.response,
        timestamp:   new Date().toISOString(),
        type:        "recommendation",
        tokens_used: data.tokens_used,
        provider:    data.provider,
        model:       data.model,
      };
      const usageUpdateRec = data._usage ?? null;
      set((state) => ({
        messages:        [...state.messages, aiMessage],
        isLoading:       false,
        totalTokensUsed: state.totalTokensUsed + (data.tokens_used ?? 0),
        dailyUsage: usageUpdateRec
          ? { used: usageUpdateRec.used, remaining: usageUpdateRec.remaining, limit: usageUpdateRec.limit }
          : { ...state.dailyUsage, used: state.dailyUsage.used + 1, remaining: Math.max(0, state.dailyUsage.remaining - 1) },
        limitReached: usageUpdateRec ? usageUpdateRec.remaining === 0 : state.limitReached,
        usageWarning: usageUpdateRec ? (usageUpdateRec.warning === true) : state.usageWarning,
      }));
      return data;
    } catch (err) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id:        `err-${Date.now()}`,
            role:      "assistant",
            content:   "⚠️ Gagal memproses rekomendasi.",
            timestamp: new Date().toISOString(),
            isError:   true,
          },
        ],
        isLoading: false,
      }));
      throw err;
    }
  },

  // --- HAPUS SEMUA PESAN (mulai sesi baru) ---
  clearMessages: () =>
    set({
      messages: [
        {
          id:        "welcome-new",
          role:      "assistant",
          content:   "Sesi baru dimulai. Ada yang bisa saya bantu?",
          timestamp: new Date().toISOString(),
        },
      ],
      error:           null,
      totalTokensUsed: 0,
    }),
    // note: limitReached dan dailyUsage sengaja tidak di-reset di sini
    // karena limit adalah per-bulan, bukan per-sesi

  // --- BERSIHKAN ERROR ---
  clearError: () => set({ error: null }),
}));

export default useAiStore;
