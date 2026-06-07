// ============================================================
// authService.js — Layanan HTTP untuk autentikasi
//
// Analogi: Ini seperti "petugas front desk" —
// dia yang ngurusin semua administrasi masuk/keluar:
// daftar akun baru, login, logout, dan cek siapa yang sedang masuk.
//
// PENTING — Dua tempat penyimpanan token:
//
//   1. localStorage  → dibaca oleh axios.js (untuk sisipkan header Authorization)
//      Contoh: localStorage.setItem("token", "abc123")
//      → Dipakai untuk request API ke backend Laravel
//
//   2. Cookie        → dibaca oleh middleware.js (untuk route guard di server)
//      Contoh: document.cookie = "token=abc123..."
//      → Dipakai untuk cek apakah user boleh akses halaman tertentu
//      → Middleware berjalan di server (tidak bisa baca localStorage), makanya pakai cookie
//
//   Kedua tempat harus disinkronkan! Jika tidak:
//   - localStorage ada, cookie tidak ada → API bisa, tapi halaman protected di-redirect ke /login
//   - Cookie ada, localStorage tidak ada → halaman tidak di-redirect, tapi API request gagal (401)
//
// Relasi:
//   - authService ← dipanggil oleh authStore.js (login, register, logout, me)
//   - authService → axios.js membaca localStorage untuk token
//   - authService → middleware.js membaca cookie untuk route guard
// ============================================================

import api from "@/lib/axios";

// Helper: simpan token ke cookie agar middleware.js bisa membacanya
// max-age=604800 = berlaku 7 hari (dalam detik)
// SameSite=Lax  = cookie dikirim saat navigasi biasa, tapi tidak di cross-site request
const setTokenCookie = (token) => {
  document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
};

// Helper: hapus cookie token (saat logout)
// Cara hapus cookie: set expires ke masa lalu
const clearTokenCookie = () => {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
};

const authService = {

  // --- LOGIN ---
  // Kirim email + password ke server, terima token Sanctum
  //
  // Backend response shape:
  //   { message: "Login berhasil", data: { user: {...}, token: "..." } }
  //
  // Perhatikan: token ada di data.data.token (bukan data.token!)
  // karena backend membungkus response di dalam { message, data: {...} }
  login: async (credentials) => {
    const { data } = await api.post("/login", credentials);
    // Destructure token dan user dari nested data.data
    const token = data.data?.token;
    const user  = data.data?.user;
    if (typeof window !== "undefined") {
      // Simpan ke localStorage → dipakai axios untuk header Authorization
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // Simpan ke cookie → dipakai middleware.js untuk route guard
      if (token) setTokenCookie(token);
    }
    return { token, user, message: data.message };
  },

  // --- REGISTER ---
  // Daftar akun baru — setelah berhasil, langsung login (dapat token)
  // Backend response shape sama dengan login
  register: async (payload) => {
    const { data } = await api.post("/register", payload);
    const token      = data.data?.token;
    const user       = data.data?.user;
    const isNewStore = data.data?.is_new_store ?? true;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (token) setTokenCookie(token);
    }
    return { token, user, is_new_store: isNewStore, message: data.message };
  },

  // --- LOGOUT ---
  // Batalkan token di server (Sanctum hapus token dari DB),
  // lalu bersihkan dari localStorage dan cookie
  //
  // try/finally: bahkan jika request gagal (misal token sudah expired),
  // kita tetap bersihkan localStorage dan cookie
  logout: async () => {
    try {
      await api.post("/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        clearTokenCookie();
      }
    }
  },

  // --- ME (ambil data user dari server) ---
  // Digunakan untuk verifikasi token masih valid dan ambil data terbaru
  // Dipanggil saat aplikasi pertama dibuka (oleh authStore.fetchCurrentUser)
  //
  // Backend response: { data: { id, name, email, role, subscription_plan, ... } }
  me: async () => {
    const { data } = await api.get("/me");
    // Fallback ke data langsung kalau tidak ada wrapper
    const user = data.data ?? data;
    // Update cache localStorage dengan data terbaru dari server
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
    return user;
  },

  // --- AMBIL USER DARI LOCALSTORAGE (synchronous, tidak perlu await) ---
  // Digunakan untuk hydrate state saat pertama kali komponen load
  // Lebih cepat dari request ke server — tampilkan data lama dulu, update nanti
  getStoredUser: () => {
    if (typeof window === "undefined") return null;  // Guard untuk SSR
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      // Kalau JSON corrupt, anggap tidak ada
      return null;
    }
  },

  // --- CEK APAKAH ADA TOKEN (synchronous) ---
  // Dipakai authStore.isAuthenticated dan fetchCurrentUser
  // untuk skip request ke server kalau token tidak ada
  hasToken: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  },
};

export default authService;
