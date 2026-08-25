// ============================================================
// subscriptionStore.js, Global state manajemen langganan (dev)
//
// Analogi: Ini seperti "papan kontrol langganan" di sisi developer,
// menyimpan daftar semua subscription tenant, statistik ringkas
// (total/aktif/free/pro/enterprise/MRR), plus aksi ganti plan
// dan toggle aktif/nonaktif langganan.
//
// Relasi:
//   - Dipakai di halaman /dev/subscriptions (developer only)
//   - PLANS diekspor dan dipakai komponen lain (upgrade page,
//     profile), jangan diubah tanpa sinkron dengan backend
//     SubscriptionController::PRICES (lihat CLAUDE.md poin 8)
//   - Berbeda dari store lain: memanggil api langsung (tidak ada
//     subscriptionService untuk endpoint /dev/subscriptions)
// ============================================================

import { create } from "zustand";
import api from "@/lib/axios";

// ============================================================
// Subscription Plans definition (frontend config)
// Harga bersumber dari backend SubscriptionController::PRICES,
// jaga agar selalu sinkron saat ada perubahan.
// ============================================================
export const PLANS = {
  free: {
    id: "free",
    name: "Gratis",
    price: 0,
    color: "gray",
    features: {
      max_products: 50,
      max_users: 2,
      ai_assistant: true,
      ai_monthly_limit: 5,
      reports_download: false,
      analytics_charts: true,
      multi_branch: false,
      priority_support: false,
      api_access: false,
    },
    limits: {
      products: "Maks. 50 produk",
      users: "Maks. 2 pengguna",
      ai: "5 prompt AI/bulan",
      transactions: "Transaksi tak terbatas",
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 129000,
    color: "yellow",
    features: {
      max_products: -1,
      max_users: 10,
      ai_assistant: true,
      ai_monthly_limit: null,
      reports_download: true,
      analytics_charts: true,
      multi_branch: false,
      priority_support: true,
      api_access: false,
    },
    limits: {
      products: "Produk tidak terbatas",
      users: "Maks. 10 pengguna",
      ai: "10 prompt AI/hari",
      transactions: "Transaksi tak terbatas",
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 499000,
    color: "black",
    features: {
      max_products: -1,
      max_users: -1,
      ai_assistant: true,
      ai_monthly_limit: null,
      reports_download: true,
      analytics_charts: true,
      multi_branch: true,
      priority_support: true,
      api_access: true,
    },
    limits: {
      products: "Produk tidak terbatas",
      users: "Pengguna tidak terbatas",
      ai: "50 prompt AI/hari",
      transactions: "Transaksi tak terbatas",
    },
  },
};

const calcStats = (subs) => ({
  total:      subs.length,
  active:     subs.filter((s) => s.status === "active").length,
  free:       subs.filter((s) => s.plan === "free").length,
  pro:        subs.filter((s) => s.plan === "pro").length,
  enterprise: subs.filter((s) => s.plan === "enterprise").length,
  mrr: subs
    .filter((s) => s.status === "active" && !s.is_developer)
    .reduce((sum, s) => sum + (PLANS[s.plan]?.price ?? 0), 0),
});

const EMPTY_STATS = { total: 0, active: 0, free: 0, pro: 0, enterprise: 0, mrr: 0 };

const useSubscriptionStore = create((set) => ({
  subscriptions: [],
  isLoading: false,
  error: null,
  stats: EMPTY_STATS,

  // --- FETCH SEMUA SUBSCRIPTION + HITUNG STATISTIK ---
  fetchSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get("/dev/subscriptions");
      const subs = data.data ?? [];
      set({
        subscriptions: subs,
        stats: calcStats(subs),
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err?.response?.data?.message ?? "Gagal memuat data subscriptions.",
        isLoading: false,
      });
    }
  },

  // --- GANTI PLAN USER ---
  // @param {number} userId
  // @param {"free" | "pro" | "enterprise"} newPlan
  updatePlan: async (userId, newPlan) => {
    await api.patch(`/dev/subscriptions/${userId}/plan`, { plan: newPlan });
    // Update daftar lokal + statistik tanpa refetch
    set((state) => {
      const subs = state.subscriptions.map((s) =>
        s.id === userId ? { ...s, plan: newPlan } : s
      );
      return { subscriptions: subs, stats: calcStats(subs) };
    });
  },

  // --- TOGGLE AKTIF/NONAKTIF LANGGANAN ---
  // @param {number} userId
  toggleStatus: async (userId) => {
    const { data } = await api.patch(`/dev/subscriptions/${userId}/toggle`);
    const newStatus = data.status;
    set((state) => {
      const subs = state.subscriptions.map((s) =>
        s.id === userId ? { ...s, status: newStatus } : s
      );
      return { subscriptions: subs, stats: calcStats(subs) };
    });
  },

  // --- CEK FITUR SUATU PLAN ---
  // @param {string} plan, "free" | "pro" | "enterprise"
  // @param {string} feature, misal "reports_download", "ai_assistant"
  hasFeature: (plan, feature) => PLANS[plan]?.features[feature] ?? false,
}));

export default useSubscriptionStore;
