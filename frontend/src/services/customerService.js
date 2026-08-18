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
  // --- DAFTAR PELANGGAN ---
  // Mengembalikan daftar pelanggan + agregat (total order, total belanja)
  // @param {Object} params — { search: nama atau nomor HP }
  // @returns { data: Customer[], ... }
  getAll: async (params = {}) => {
    const { data } = await api.get(`/customers${buildQueryString(params)}`);
    return data;
  },

  // --- DETAIL SATU PELANGGAN ---
  // @param {number} id
  // @returns { data: { customer, recent_orders } } — termasuk 20 order terbaru
  getById: async (id) => {
    const { data } = await api.get(`/customers/${id}`);
    return data.data;
  },
};

export default customerService;
