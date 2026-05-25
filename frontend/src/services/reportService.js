// ============================================================
// reportService.js — Layanan laporan penjualan & stok
//
// Analogi: Ini seperti "akuntan otomatis" —
// dia tahu semua angka penjualan dan bisa cetak laporan
// dalam format yang sudah siap dibaca atau diunduh.
//
// Relasi ke Backend:
//   GET /api/reports/sales          → data laporan penjualan (JSON)
//   GET /api/reports/stock          → data laporan stok (JSON)
//   GET /api/reports/sales/download → unduh laporan penjualan (PDF/Excel)
//   GET /api/reports/stock/download → unduh laporan stok (PDF/Excel)
//
// Semua endpoint ini hanya untuk admin/kasir.
// ============================================================

import api from "@/lib/axios";
import { buildQueryString } from "@/lib/utils";

const reportService = {

  // --- LAPORAN PENJUALAN ---
  // Mengembalikan data penjualan dalam format JSON (untuk grafik/tabel)
  // Analogi: minta ringkasan buku kas → dapat angka-angka yang bisa ditampilkan
  //
  // @param {Object} params:
  //   period    : "daily" (per hari) | "monthly" (per bulan)
  //   year      : tahun (misal 2024) — untuk laporan bulanan
  //   date_from : "YYYY-MM-DD" — untuk laporan harian
  //   date_to   : "YYYY-MM-DD"
  //
  // @returns:
  //   { summary: { total_revenue, total_orders, total_items }, data: [...] }
  getSales: async (params = {}) => {
    const { data } = await api.get(`/reports/sales${buildQueryString(params)}`);
    return data;
  },

  // --- LAPORAN STOK ---
  // Mengembalikan kondisi stok semua produk: stok saat ini, status (rendah/normal)
  // Analogi: cek isi gudang — mana yang hampir habis, mana yang masih banyak
  //
  // @returns { data: Product[], summary: { total_products, low_stock_count } }
  getStock: async () => {
    const { data } = await api.get("/reports/stock");
    return data;
  },

  // --- UNDUH LAPORAN PENJUALAN ---
  // Backend mengembalikan file (bukan JSON), sehingga perlu responseType: "blob"
  // Analogi: meminta cetak laporan → dapat file fisik, bukan data mentah
  //
  // @param {{ format?: "pdf" | "excel", ...period params }} params
  downloadSales: async (params = {}) => {
    const response = await api.get(
      `/reports/sales/download${buildQueryString(params)}`,
      { responseType: "blob" }   // "blob" = file biner (PDF/Excel)
    );
    return response;
  },

  // --- UNDUH LAPORAN STOK ---
  downloadStock: async (params = {}) => {
    const response = await api.get(
      `/reports/stock/download${buildQueryString(params)}`,
      { responseType: "blob" }
    );
    return response;
  },
};

// --- Helper: trigger download file di browser ---
// Analogi: kasir menyerahkan struk cetak ke tangan pelanggan
// Dipanggil setelah downloadSales() atau downloadStock() berhasil
export function triggerFileDownload(response, filename) {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default reportService;
