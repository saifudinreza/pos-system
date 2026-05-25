// ============================================================
// categoryService.js — Layanan manajemen kategori produk
//
// Analogi: Ini seperti "labeling di rak toko" —
// kategori adalah label/divisi yang mengelompokkan produk.
// Misalnya: "Minuman", "Makanan Berat", "Camilan".
//
// Relasi ke Backend:
//   GET    /api/categories       → daftar kategori (semua user yg login)
//   GET    /api/categories/{id}  → detail kategori + preview produk di dalamnya
//   POST   /api/categories       → buat kategori baru (admin only)
//   PUT    /api/categories/{id}  → update kategori (admin only)
//   DELETE /api/categories/{id}  → hapus kategori (admin only)
//
// Model Category fields:
//   id, name, slug (auto dari name), is_active
//
// Note: slug dibuat otomatis oleh backend dari field "name"
//   "Es Teh Manis" → slug: "es-teh-manis"
//   Slug digunakan untuk URL-friendly identifier
// ============================================================

import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const categoryService = {

  // --- DAFTAR KATEGORI ---
  // @param {{ search?: string, is_active?: boolean }} params
  // @returns Category[] (bukan paginated — backend mengembalikan semua sekaligus)
  getAll: async (params = {}) => {
    const { data } = await api.get(`/categories${buildQueryString(params)}`);
    // Backend bisa kembalikan { data: [...] } atau langsung array
    return data.data ?? data;
  },

  // --- DETAIL KATEGORI ---
  // Mengembalikan kategori beserta preview produk yang ada di dalamnya
  // Berguna untuk halaman detail kategori
  getById: async (id) => {
    const { data } = await api.get(`/categories/${id}`);
    return data.data ?? data;
  },

  // --- BUAT KATEGORI ---
  // Backend otomatis generate slug dari field "name"
  // @param {{ name: string, is_active?: boolean }} payload
  create: async (payload) => {
    const { data } = await api.post("/categories", payload);
    return data;
  },

  // --- UPDATE KATEGORI ---
  // Slug akan di-regenerate jika nama berubah
  update: async (id, payload) => {
    const { data } = await api.put(`/categories/${id}`, payload);
    return data;
  },

  // --- HAPUS KATEGORI ---
  // Backend mungkin menolak jika masih ada produk di kategori ini
  delete: async (id) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },
};

export default categoryService;
