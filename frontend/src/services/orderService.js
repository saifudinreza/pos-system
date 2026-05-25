// ============================================================
// orderService.js — Layanan manajemen pesanan (order)
//
// Analogi: Ini seperti "buku pesanan" di restoran —
// setiap pesanan masuk dicatat (POST /orders),
// koki/kasir bisa lihat semua pesanan (GET /orders),
// dan status pesanan bisa diupdate (PATCH status).
//
// Alur hidup sebuah Order:
//   1. Pelanggan/kasir buat order → status: "pending"
//   2. Lanjut ke transaksi (payment) via transactionService
//   3. Setelah bayar → Midtrans webhook ubah status → "paid"
//   4. Jika dibatalkan → status: "cancelled"
//
// Relasi ke Backend:
//   POST  /api/orders              → buat order baru (semua user)
//   GET   /api/orders              → semua order (admin/kasir only)
//   GET   /api/orders/{id}         → detail order (owner/admin/kasir)
//   GET   /api/orders/my/history   → order milik user yang login
//   PATCH /api/orders/{id}/status  → update status (admin/kasir only)
//
// Model Order fields:
//   id, user_id, order_number, status, subtotal, tax (11% PPN), total, notes
//   Relasi: user, items (OrderItem[]), transaction
// ============================================================

import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const orderService = {

  // --- BUAT ORDER BARU ---
  // Analogi: pelanggan menyerahkan daftar pesanan ke kasir
  // Backend akan:
  //   1. Hitung subtotal dari items × harga produk
  //   2. Tambah PPN 11% → total
  //   3. Kurangi stok produk otomatis
  //   4. Generate nomor order: "ORD-20240115-0001"
  //
  // @param {{ items: [{product_id, quantity}][], notes?: string }} payload
  // @returns { message, order: Order }
  create: async (payload) => {
    const { data } = await api.post("/orders", payload);
    return data;
  },

  // --- DAFTAR SEMUA ORDER (admin/kasir) ---
  // @param {Object} params:
  //   status    : "pending" | "paid" | "cancelled"
  //   user_id   : filter per pelanggan
  //   date_from : "YYYY-MM-DD" — filter dari tanggal
  //   date_to   : "YYYY-MM-DD" — filter sampai tanggal
  //   page, per_page
  getAll: async (params = {}) => {
    const { data } = await api.get(`/orders${buildQueryString(params)}`);
    return data;
  },

  // --- DETAIL SATU ORDER ---
  // Mengembalikan order beserta items dan transaction
  // Bisa diakses oleh: pemilik order, admin, atau kasir
  getById: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data.data ?? data;
  },

  // --- RIWAYAT ORDER SAYA (user biasa/pelanggan) ---
  // Hanya mengembalikan order milik user yang sedang login
  // Analogi: lihat riwayat belanja sendiri (bukan semua pelanggan)
  getMyOrders: async (params = {}) => {
    const { data } = await api.get(`/orders/my/history${buildQueryString(params)}`);
    return data;
  },

  // --- UPDATE STATUS ORDER (admin/kasir) ---
  // Analogi: kasir mengubah status di "buku pesanan"
  // misalnya: "pending" → "cancelled" (jika pembayaran batal manual)
  //
  // @param {number} id
  // @param {"pending" | "paid" | "cancelled"} status
  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return data;
  },
};

export default orderService;
