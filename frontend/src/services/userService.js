// ============================================================
// userService.js — Layanan manajemen pengguna (admin only)
//
// Analogi: Ini seperti "bagian HRD" di perusahaan —
// bisa lihat daftar karyawan, ubah data, atau nonaktifkan akun.
//
// Semua endpoint di sini HANYA bisa diakses oleh admin.
//
// Relasi ke Backend:
//   GET   /api/users           → daftar semua user (dengan filter)
//   GET   /api/users/{id}      → detail satu user
//   PUT   /api/users/{id}      → update data user
//   PATCH /api/users/{id}/toggle → aktifkan/nonaktifkan user
//
// Model User fields:
//   id, name, email, role (admin|kasir|user), phone, is_active
// ============================================================

import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const userService = {

  // --- DAFTAR SEMUA USER ---
  // @param {Object} params:
  //   search    : cari nama atau email
  //   role      : "admin" | "kasir" | "user"
  //   is_active : true | false
  //   page, per_page
  getAll: async (params = {}) => {
    const { data } = await api.get(`/users${buildQueryString(params)}`);
    return data;
  },

  // --- DETAIL USER ---
  getById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return data.data ?? data;
  },

  // --- UPDATE DATA USER ---
  // Bisa update: name, email, role, phone, password (opsional)
  // Jika password kosong, backend tidak mengubah password
  // Analogi: HRD mengupdate data karyawan di sistem
  //
  // @param {number} id
  // @param {{ name?, email?, role?, phone?, password?, is_active? }} payload
  update: async (id, payload) => {
    const { data } = await api.put(`/users/${id}`, payload);
    return data;
  },

  // --- TOGGLE AKTIF/NONAKTIF USER ---
  // Analogi: HRD menonaktifkan akses karyawan yang sedang cuti atau keluar
  // Tidak menghapus akun — hanya ubah is_active (true ↔ false)
  //
  // @param {number} id
  // @returns { message, user }
  toggleActive: async (id) => {
    const { data } = await api.patch(`/users/${id}/toggle`);
    return data;
  },
};

export default userService;
