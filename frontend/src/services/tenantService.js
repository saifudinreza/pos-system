// ============================================================
// tenantService.js, Layanan manajemen tenant (developer only)
//
// Analogi: Ini seperti "panel kontrol gedung",
// hanya developer yang bisa lihat & kelola seluruh "toko" (tenant)
// yang memakai KasirAI, termasuk ubah data atau hapus.
//
// Relasi ke Backend (semua endpoint di bawah /api/dev/*):
//   GET    /api/dev/tenants        → daftar semua tenant
//   GET    /api/dev/tenants/{id}   → detail satu tenant
//   PUT    /api/dev/tenants/{id}   → update data tenant
//   DELETE /api/dev/tenants/{id}   → hapus tenant
// ============================================================

import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const tenantService = {
  // --- DAFTAR SEMUA TENANT ---
  // @param {{ search?, page?, per_page? }} params
  getAll: async (params = {}) => {
    const { data } = await api.get(`/dev/tenants${buildQueryString(params)}`);
    return data;
  },

  // --- DETAIL SATU TENANT ---
  // @param {number} id
  getById: async (id) => {
    const { data } = await api.get(`/dev/tenants/${id}`);
    return data.data ?? data;
  },

  // --- UPDATE DATA TENANT ---
  // @param {number} id
  // @param {Object} payload, field tenant yang mau diubah
  update: async (id, payload) => {
    const { data } = await api.put(`/dev/tenants/${id}`, payload);
    return data;
  },

  // --- HAPUS TENANT ---
  // @param {number} id
  delete: async (id) => {
    const { data } = await api.delete(`/dev/tenants/${id}`);
    return data;
  },
};

export default tenantService;
