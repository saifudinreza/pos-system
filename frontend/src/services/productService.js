// ============================================================
// productService.js — Layanan manajemen produk
//
// Analogi: Ini seperti "manajer gudang" —
// bisa melihat daftar barang, mencari barang tertentu,
// menambah/mengubah/menghapus stok.
//
// Relasi ke Backend (routes/api.php):
//   GET    /api/products           → daftar produk (semua user yg login)
//   GET    /api/products/{id}      → detail satu produk
//   POST   /api/products           → tambah produk baru (admin only)
//   PUT    /api/products/{id}      → update produk (admin only)
//   DELETE /api/products/{id}      → hapus produk (admin only, hanya yg belum pernah di-order)
//
// Response Laravel pagination format:
//   { data: [...], links: {...}, meta: { current_page, last_page, total, per_page } }
//
// Model Product fields:
//   id, category_id, name, sku, description, price, stock, stock_alert,
//   image, is_active, is_low_stock (computed), category (relation)
// ============================================================

import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const productService = {

  // --- DAFTAR PRODUK (dengan filter & pagination) ---
  // Analogi: lihat katalog produk di gudang, bisa filter dan cari
  //
  // @param {Object} params - filter opsional:
  //   search      : cari berdasarkan nama produk
  //   category_id : filter per kategori
  //   is_active   : true/false — tampilkan hanya produk aktif/nonaktif
  //   low_stock   : true — tampilkan hanya produk stok rendah
  //   sort_by     : "name" | "price" | "stock"
  //   sort_order  : "asc" | "desc"
  //   page        : halaman ke-berapa (default 1)
  //   per_page    : jumlah item per halaman (default 10)
  //
  // @returns { data: Product[], meta: { total, current_page, last_page } }
  getAll: async (params = {}) => {
    const { data } = await api.get(`/products${buildQueryString(params)}`);
    return data;
  },

  // --- DETAIL SATU PRODUK ---
  // @returns Product (dengan relasi category)
  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data.data ?? data;
  },

  // --- BUAT PRODUK BARU (admin only) ---
  // Analogi: mendaftarkan produk baru ke katalog gudang
  //
  // Penting: backend menerima gambar sebagai file upload (multipart/form-data)
  // Jika ada gambar, kita kirim FormData. Jika tidak, kirim JSON biasa.
  //
  // @param {Object} payload:
  //   category_id*, name*, sku*, price*, stock, stock_alert, description,
  //   image (File object), is_active
  create: async (payload) => {
    let body = payload;
    let config = {};

    // Jika ada file gambar, ubah ke FormData
    // Analogi: paket biasa dikirim amplop biasa, paket besar pakai kardus
    if (payload.image instanceof File) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          form.append(key, val);
        }
      });
      body = form;
      // Hapus Content-Type header agar browser/axios set multipart + boundary otomatis
      config = { headers: { "Content-Type": undefined } };
    }

    const { data } = await api.post("/products", body, config);
    return data;
  },

  // --- UPDATE PRODUK (admin only) ---
  // Laravel menerima PUT untuk update. Jika ada file baru, pakai POST + _method=PUT
  // karena PHP tidak bisa baca multipart dari PUT secara native.
  // Analogi: revisi data di katalog — kalau ada foto baru, tukar foto lamanya
  //
  // @param {number} id
  // @param {Object} payload — field yang mau diubah (partial update diterima backend)
  update: async (id, payload) => {
    let body = payload;
    let config = {};

    if (payload.image instanceof File) {
      // Gunakan POST + _method=PUT (Laravel method spoofing)
      // karena multipart/form-data tidak bisa dikirim via PUT di beberapa server
      const form = new FormData();
      form.append("_method", "PUT");
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          form.append(key, val);
        }
      });
      body = form;
      config = { headers: { "Content-Type": undefined } };
      const { data } = await api.post(`/products/${id}`, body, config);
      return data;
    }

    const { data } = await api.put(`/products/${id}`, body, config);
    return data;
  },

  // --- HAPUS PRODUK (admin only) ---
  // Backend menolak hapus jika produk sudah pernah ada di order
  // Analogi: tidak boleh hapus catatan barang yang sudah pernah terjual
  delete: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
};

export default productService;
