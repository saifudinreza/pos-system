// ============================================================
// shiftService.js — Layanan manajemen shift kasir
//
// Analogi: Ini seperti "jam kerja toko" —
// kasir buka shift (open) dengan modal awal, transaksi dicatat
// dalam shift itu, lalu tutup shift (close) dengan hitung kas.
//
// Relasi ke Backend:
//   GET  /api/shifts/current       → shift yang sedang aktif
//   POST /api/shifts/open          → buka shift baru
//   POST /api/shifts/{id}/close    → tutup shift + hitung kas
//   GET  /api/shifts/{id}/report   → laporan shift (rekap penjualan)
//   GET  /api/shifts               → riwayat shift
//
// Catatan: shift bersifat PER-TENANT, bukan per-user — satu shift
// aktif dipakai bersama semua kasir dalam tenant yang sama.
// Transaksi diblokir di luar jam shift (enforcement di backend).
// ============================================================

import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const shiftService = {
  // --- SHIFT YANG SEDANG AKTIF ---
  // @returns { data: Shift | null } — null kalau belum ada shift terbuka
  getCurrent: async () => {
    const { data } = await api.get("/shifts/current");
    return data;
  },

  // --- BUKA SHIFT ---
  // Backward-compatible: terima angka (modal awal) ATAU objek payload lengkap
  // @param {number|{ opening_balance, opening_note?, opening_denominations? }} payload
  open: async (payload) => {
    const body = typeof payload === "object" ? payload : { opening_balance: payload };
    const { data } = await api.post("/shifts/open", body);
    return data;
  },

  // --- TUTUP SHIFT + HITUNG KAS ---
  // @param {number} id
  // @param {{ closing_balance, closing_denominations?, petty_cash?, petty_cash_note?, notes?, verified_by? }} payload
  close: async (id, payload) => {
    const { data } = await api.post(`/shifts/${id}/close`, payload);
    return data;
  },

  // --- LAPORAN SATU SHIFT ---
  // @param {number} id
  getReport: async (id) => {
    const { data } = await api.get(`/shifts/${id}/report`);
    return data;
  },

  // --- RIWAYAT SEMUA SHIFT ---
  // @param {{ page?, per_page? }} params
  getAll: async (params = {}) => {
    const { data } = await api.get(`/shifts${buildQueryString(params)}`);
    return data;
  },
};

export default shiftService;
