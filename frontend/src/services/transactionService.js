// ============================================================
// transactionService.js, Layanan pembayaran (Midtrans)
//
// Analogi: Ini seperti "mesin EDC" di kasir,
// setelah order dibuat, kita minta mesin EDC (Midtrans) untuk
// memproses pembayaran. Mesin kasir dapat "Snap Token" dari Midtrans,
// lalu tampilkan popup pembayaran ke pelanggan.
//
// Alur Pembayaran:
//   1. Buat order → dapat order_id
//   2. Buat transaksi (POST /transactions) → dapat snap_token
//   3. Gunakan snap_token → buka Midtrans Snap popup di frontend
//   4. Pelanggan bayar (QRIS / transfer / dsb)
//   5. Midtrans kirim webhook ke backend → status otomatis update
//   6. Frontend poll GET /transactions/{id} untuk cek status terbaru
//
// Relasi ke Backend:
//   POST /api/transactions              → buat transaksi, dapat snap_token
//   GET  /api/transactions             → semua transaksi (admin/kasir)
//   GET  /api/transactions/{id}        → detail transaksi
//   GET  /api/transactions/my/history  → transaksi milik user login
//
// Model Transaction fields:
//   id, order_id, midtrans_order_id, midtrans_transaction_id,
//   payment_method, status, amount, snap_token, paid_at,
//   midtrans_response (raw JSON dari Midtrans)
//
// Status Midtrans: "pending" | "settlement" | "expire" | "cancel" | "deny"
// ============================================================

import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const transactionService = {

  // --- BUAT TRANSAKSI BARU (inisiasi pembayaran) ---
  // Memanggil Midtrans Snap API via backend, mendapat snap_token
  // snap_token berlaku 24 jam, dipakai untuk buka popup Midtrans di frontend
  //
  // @param {{ order_id: number }} payload
  // @returns { message, transaction: { snap_token, status, amount, ... } }
  create: async (payload) => {
    const { data } = await api.post("/transactions", payload);
    return data;
  },

  // --- DAFTAR SEMUA TRANSAKSI (admin/kasir) ---
  // @param {{ status?, date_from?, date_to?, page?, per_page? }} params
  getAll: async (params = {}) => {
    const { data } = await api.get(`/transactions${buildQueryString(params)}`);
    return data;
  },

  // --- DETAIL TRANSAKSI ---
  // Digunakan untuk poll status pembayaran setelah pelanggan bayar
  // Analogi: cek struk pembayaran, sudah lunas atau belum
  getById: async (id) => {
    const { data } = await api.get(`/transactions/${id}`);
    return data.data ?? data;
  },

  // --- RIWAYAT TRANSAKSI SAYA ---
  getMyTransactions: async (params = {}) => {
    const { data } = await api.get(`/transactions/my/history${buildQueryString(params)}`);
    return data;
  },

  // --- BATALKAN TRANSAKSI PENDING ---
  // Hanya bisa untuk status "pending"
  cancel: async (id) => {
    const { data } = await api.patch(`/transactions/${id}/cancel`);
    return data;
  },
};

export default transactionService;
