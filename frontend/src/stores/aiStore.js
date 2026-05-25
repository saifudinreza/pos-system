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
//   - aiStore → dibaca oleh AIChatBubble.jsx (tampilkan riwayat chat)
//   - aiStore → dibaca oleh AIQuickPrompts.jsx (tombol cepat kirim pertanyaan)
//   - aiStore → AITypingIndicator.jsx tampil saat isLoading = true
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

const useAiStore = create((set, get) => ({
  // ============================================================
  // STATE
  // ============================================================

  // Array semua pesan di sesi ini
  // Dimulai dengan pesan selamat datang dari AI
  messages: [
    {
      id:        "welcome",
      role:      "assistant",
      content:   "Halo! Saya AI Assistant KasirAI. Tanya apa saja tentang bisnis Anda — penjualan, stok, tren produk, atau rekomendasi strategi. Saya siap membantu! 🤖",
      timestamp: new Date().toISOString(),
    },
  ],

  // Apakah AI sedang memproses (loading)
  // Saat true → tampilkan indikator "AI sedang mengetik..."
  isLoading: false,

  // Pesan error jika request gagal
  error: null,

  // Jumlah total token yang terpakai dalam sesi ini
  // Berguna untuk monitoring biaya API Groq
  totalTokensUsed: 0,

  // ============================================================
  // ACTIONS
  // ============================================================

  // --- KIRIM PERTANYAAN KE AI (sales analysis) ---
  // Tipe query paling umum: analisis penjualan, tren, comparatif, dll
  // Analogi: kirim pertanyaan ke konsultan → tunggu jawaban
  sendQuery: async (query) => {
    const userMessage = {
      id:        `user-${Date.now()}`,
      role:      "user",
      content:   query,
      timestamp: new Date().toISOString(),
    };

    // Tampilkan pesan user dulu (sebelum menunggu respons AI)
    set((state) => ({
      messages:  [...state.messages, userMessage],
      isLoading: true,
      error:     null,
    }));

    try {
      const data = await aiService.query(query);

      // Tambahkan respons AI ke chat
      const aiMessage = {
        id:          `ai-${Date.now()}`,
        role:        "assistant",
        content:     data.response,
        timestamp:   new Date().toISOString(),
        type:        "sales_analysis",
        tokens_used: data.tokens_used,
      };

      set((state) => ({
        messages:        [...state.messages, aiMessage],
        isLoading:       false,
        totalTokensUsed: state.totalTokensUsed + (data.tokens_used ?? 0),
      }));

      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.message ?? "AI tidak bisa menjawab saat ini. Coba lagi.";

      // Tambahkan pesan error sebagai respons AI (bukan popup)
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
        isLoading: false,
        error:     errorMsg,
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
      };
      set((state) => ({
        messages:        [...state.messages, aiMessage],
        isLoading:       false,
        totalTokensUsed: state.totalTokensUsed + (data.tokens_used ?? 0),
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
      };
      set((state) => ({
        messages:        [...state.messages, aiMessage],
        isLoading:       false,
        totalTokensUsed: state.totalTokensUsed + (data.tokens_used ?? 0),
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
  // Analogi: mulai percakapan baru — hapus riwayat chat sebelumnya
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

  // --- BERSIHKAN ERROR ---
  clearError: () => set({ error: null }),
}));

export default useAiStore;
