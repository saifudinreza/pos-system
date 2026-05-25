// ============================================================
// authService.js — Layanan autentikasi (Login, Register, Logout)
//
// Analogi: Ini seperti "petugas loket" di kantor —
// menerima permohonan masuk (login), mendaftarkan anggota baru (register),
// dan mencatat keluar (logout). Setiap aksi menghasilkan atau
// menghapus "kartu anggota" (token Bearer Sanctum).
//
// Relasi ke Backend:
//   POST /api/login    → kirim email + password, dapat token + data user
//   POST /api/register → daftar akun baru, langsung dapat token + data user
//   POST /api/logout   → batalkan token yang aktif sekarang
//   GET  /api/me       → ambil data user yang sedang login
//
// Token disimpan di localStorage dengan key "token"
// Token format: Bearer token dari Laravel Sanctum (plainTextToken)
// ============================================================

import api from "@/lib/axios";

const authService = {

  // --- LOGIN ---
  // Kirim email + password, server validasi & kirim token balik
  // Analogi: memasukkan kunci (password) ke lubang kunci (server) —
  // kalau cocok, pintu terbuka dan kita dapat "kartu akses" (token)
  //
  // @param {{ email: string, password: string }} credentials
  // @returns {{ message, user, token }}
  login: async (credentials) => {
    const { data } = await api.post("/login", credentials);
    // Simpan token & data user di localStorage supaya bisa dipakai request berikutnya
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  },

  // --- REGISTER ---
  // Buat akun baru. Backend langsung kembalikan token (auto-login setelah daftar)
  // Analogi: seperti mengisi formulir keanggotaan dan langsung dapat kartu member
  //
  // @param {{ name, email, password, password_confirmation, phone? }} payload
  // @returns {{ message, user, token }}
  register: async (payload) => {
    const { data } = await api.post("/register", payload);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
  },

  // --- LOGOUT ---
  // Batalkan token yang aktif di server, lalu bersihkan localStorage
  // Analogi: menyerahkan kartu akses kembali ke loket saat pulang
  logout: async () => {
    try {
      await api.post("/logout");
    } finally {
      // "finally" = selalu bersihkan localStorage walau request gagal
      // Analogi: tetap keluarkan kartu dari saku walau loket sudah tutup
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  },

  // --- GET USER SAAT INI ---
  // Ambil data user berdasarkan token yang aktif
  // Berguna saat aplikasi pertama dibuka (refresh halaman) —
  // kita perlu cek apakah token yang tersimpan masih valid
  // Analogi: masuk kantor dengan kartu akses, satpam cek apakah kartu masih aktif
  //
  // @returns {{ id, name, email, role, phone, is_active, ... }}
  me: async () => {
    const { data } = await api.get("/me");
    // Update data user di localStorage agar selalu fresh
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(data.user ?? data));
    }
    return data.user ?? data;
  },

  // --- AMBIL USER DARI LOCALSTORAGE (sync, tanpa request) ---
  // Digunakan saat inisialisasi store, sebelum request /me selesai
  // Analogi: lihat dompet dulu sebelum pergi ke kantor —
  // apakah ada kartu akses atau tidak
  getStoredUser: () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // --- CEK APAKAH ADA TOKEN (sync) ---
  hasToken: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  },
};

export default authService;
