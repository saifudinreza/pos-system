// ============================================================
// customerService.js — Layanan manajemen pelanggan (CRM)
//
// Analogi: "buku tamu" toko — mendata siapa saja yang pernah
// belanja (lewat nomor HP struk WhatsApp) beserta total belanjanya.
//
// Relasi ke Backend:
//   GET /api/customers           → daftar pelanggan + ringkasan
//   GET /api/customers/{id}      → detail + riwayat order
//
// Hanya admin & developer.
// ============================================================

import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const customerService = {
  // Daftar pelanggan — @param {Object} params: { search }
  getAll: async (params = {}) => {
    const { data } = await api.get(`/customers${buildQueryString(params)}`);
    return data;
  },

  // Detail + riwayat order satu pelanggan
  getById: async (id) => {
    const { data } = await api.get(`/customers/${id}`);
    return data.data;
  },
};

export default customerService;
