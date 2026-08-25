// ============================================================
// authService.js, Layanan HTTP untuk autentikasi
//
// Analogi: Ini seperti "petugas front desk",
// dia yang ngurusin semua administrasi masuk/keluar:
// daftar akun baru, login, logout, dan cek siapa yang sedang masuk.
//
// PENTING, Dua tempat penyimpanan token:
//
//   1. sessionStorage  → dibaca oleh axios.js (untuk sisipkan header Authorization)
//      Contoh: sessionStorage.setItem("token", "abc123")
//      → Dipakai untuk request API ke backend Laravel
//      → sessionStorage hilang saat tab/browser ditutup → auto logout di bukaan baru
//
//   2. Cookie (sesi)  → dibaca oleh middleware.js (untuk route guard di server)
//      Contoh: document.cookie = "token=abc123..."
//      → Dipakai untuk cek apakah user boleh akses halaman tertentu
//      → Middleware berjalan di server (tidak bisa baca sessionStorage), makanya pakai cookie
//      → Cookie tanpa max-age = cookie sesi, ikut hilang saat browser ditutup
//
//   Kedua tempat harus disinkronkan! Jika tidak:
//   - sessionStorage ada, cookie tidak ada → API bisa, tapi halaman protected di-redirect ke /login
//   - Cookie ada, sessionStorage tidak ada → halaman tidak di-redirect, tapi API request gagal (401)
//
// Relasi:
//   - authService ← dipanggil oleh authStore.js (login, register, logout, me)
//   - authService → axios.js membaca localStorage untuk token
//   - authService → middleware.js membaca cookie untuk route guard
// ============================================================

import api from "@/lib/axios";

// --- HELPER: SIMPAN TOKEN KE COOKIE ---
// Agar middleware.js bisa membacanya
// Tanpa max-age/expires → cookie sesi: otomatis hilang saat browser
// ditutup, sehingga user harus login ulang di tab baru (sesuai kebutuhan).
// SameSite=Lax  = cookie dikirim saat navigasi biasa, tapi tidak di cross-site request
const setTokenCookie = (token) => {
  document.cookie = `token=${token}; path=/; SameSite=Lax`;
};

// --- HELPER: HAPUS COOKIE TOKEN (saat logout) ---
// Cara hapus cookie: set expires ke masa lalu
const clearTokenCookie = () => {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
};

// --- HELPER: SIMPAN SESI LOGIN ---
// Dipakai bersama oleh login() dan register(), kedua tempat penyimpanan
// (sessionStorage + cookie) harus selalu sinkron, makanya disatukan di sini
const persistSession = (token, user) => {
  if (typeof window === "undefined") return;
  // sessionStorage → dibaca axios.js untuk sisipkan header Authorization.
  // sessionStorage hilang saat tab/browser ditutup → auto logout di tab baru.
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("user", JSON.stringify(user));
  // Cookie → dibaca middleware.js untuk route guard
  if (token) setTokenCookie(token);
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
    persistSession(token, user);
    return { token, user, message: data.message };
  },

  // --- REGISTER ---
  // Daftar akun baru, setelah berhasil, langsung login (dapat token)
  // Backend response shape sama dengan login
  register: async (payload) => {
    const { data } = await api.post("/register", payload);
    const token      = data.data?.token;
    const user       = data.data?.user;
    const isNewStore = data.data?.is_new_store ?? true;
    persistSession(token, user);
    return { token, user, is_new_store: isNewStore, message: data.message };
  },

  // --- FORGOT PASSWORD (minta link reset via email) ---
  // POST /api/forgot-password
  // Server selalu balas pesan yang sama, terdaftar atau tidak (anti user-enumeration)
  forgotPassword: async (email) => {
    const { data } = await api.post("/forgot-password", { email });
    return data;
  },

  // --- RESET PASSWORD (ganti password pakai token dari email) ---
  // POST /api/reset-password
  resetPassword: async ({ email, token, password, password_confirmation }) => {
    const { data } = await api.post("/reset-password", { email, token, password, password_confirmation });
    return data;
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
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
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
    // Update cache sessionStorage dengan data terbaru dari server
    if (typeof window !== "undefined") {
      sessionStorage.setItem("user", JSON.stringify(user));
    }
    return user;
  },

  // --- AMBIL USER DARI SESSIONSTORAGE (synchronous, tidak perlu await) ---
  // Digunakan untuk hydrate state saat pertama kali komponen load
  // Lebih cepat dari request ke server, tampilkan data lama dulu, update nanti
  getStoredUser: () => {
    if (typeof window === "undefined") return null;  // Guard untuk SSR
    try {
      const raw = sessionStorage.getItem("user");
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
    return !!sessionStorage.getItem("token");
  },
};

export default authService;
