// ============================================================
// subscriptionService.js, Layanan langganan (plan) & profil
//
// Analogi: Ini seperti "loket pembayaran langganan",
// cek status paket aktif, mulai pembayaran upgrade (Midtrans),
// batalkan pembayaran yang belum lunas, dan update data toko.
//
// Relasi ke Backend:
//   GET  /api/subscription                  → status langganan saat ini
//   POST /api/subscription/initiate         → mulai pembayaran upgrade
//   POST /api/subscription/cancel-pending   → batalkan pembayaran pending
//   PUT  /api/profile                       → update data profil toko
//
// Catatan: updateProfile() sengaja diletakkan di sini (dipakai halaman
// profile) walaupun endpoint-nya /profile, bukan /subscription/*.
// ============================================================

import api from "@/lib/axios";

const subscriptionService = {
  // --- STATUS LANGGANAN ---
  // @returns { data: { plan, status, ... } }
  getStatus: async () => {
    const { data } = await api.get("/subscription");
    return data;
  },

  // --- MULAI PEMBAYARAN UPGRADE (Midtrans) ---
  // @param {{ plan: "pro" | "enterprise", billing_period: "monthly" | "yearly" }} payload
  initiate: async (payload) => {
    const { data } = await api.post("/subscription/initiate", payload);
    return data;
  },

  // --- BATALKAN PEMBAYARAN YANG MASIH PENDING ---
  // Dipakai kalau user ganti pilihan plan sebelum transaksi lunas
  cancelPending: async () => {
    const { data } = await api.post("/subscription/cancel-pending");
    return data;
  },

  // --- UPDATE DATA PROFIL TOKO ---
  // Endpoint /profile (bukan /subscription), lihat catatan di header
  // @param {{ name?, phone?, address?, ... }} payload
  updateProfile: async (payload) => {
    const { data } = await api.put("/profile", payload);
    return data;
  },
};

export default subscriptionService;
