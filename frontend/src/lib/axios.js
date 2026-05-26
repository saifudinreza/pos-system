// ============================================================
// axios.js — Konfigurasi HTTP Client utama
//
// Analogi: Ini seperti "kurir resmi" antara frontend dan backend.
// Setiap kali frontend mau minta/kirim data ke server Laravel,
// semua permintaan itu dikirim lewat kurir ini.
//
// Keuntungan pakai satu axios instance:
// - Token auth otomatis disisipkan di setiap request (tidak perlu ulang-ulang)
// - Jika token expired (401), otomatis redirect ke login
// - Base URL (alamat backend) cukup ditulis satu kali di sini
// ============================================================

import axios from "axios";

// Buat satu "kurir" dengan konfigurasi dasar
// baseURL: alamat server backend Laravel (dari .env.local)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // → http://localhost:8000/api
  // TIDAK set Content-Type global di sini, karena:
  // - JSON request: axios otomatis set application/json
  // - File upload (FormData): browser harus set multipart/form-data + boundary sendiri
  // Jika kita paksa application/json, upload gambar produk akan gagal
});

// ============================================================
// INTERCEPTOR REQUEST — "Pemeriksaan sebelum surat dikirim"
// Analogi: seperti petugas pos yang selalu cek apakah ada materai (token)
// sebelum surat dikirimkan ke tujuan
// ============================================================
api.interceptors.request.use(
  (config) => {
    // Hanya akses localStorage di browser (bukan saat SSR di server Next.js)
    // Analogi: kurir hanya bawa kunci kalau sedang di dunia nyata, bukan di mimpi
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        // Sisipkan token Bearer di setiap request
        // Backend Laravel Sanctum membaca header: "Authorization: Bearer {token}"
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// INTERCEPTOR RESPONSE — "Pemeriksaan saat surat balasan datang"
// Analogi: seperti resepsionis yang sortir surat — surat normal
// langsung diteruskan, surat masalah (error) ditangani lebih dulu
// ============================================================
api.interceptors.response.use(
  // Respons sukses (2xx): langsung teruskan tanpa perubahan
  (response) => response,

  // Respons error: periksa jenis errornya
  (error) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401) {
        // 401 = Unauthorized: token tidak valid atau sudah expired
        // Hapus SEMUA penyimpanan token (localStorage + cookie) agar middleware
        // tidak redirect loop antara /login ↔ /dashboard
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        window.location.href = "/login";
      }

      if (error.response?.status === 403) {
        // 403 = Forbidden: token valid tapi tidak punya izin (role tidak cukup)
        // Analogi: punya kunci rumah tapi tidak boleh masuk ruang tertentu
        console.warn("[API] 403 Forbidden — akses ditolak untuk resource ini");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
