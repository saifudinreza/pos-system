// ============================================================
// authStore.js — Global state untuk autentikasi
//
// Analogi: Ini seperti "dompet digital" aplikasi —
// menyimpan siapa yang sedang login, apa role-nya, dan apakah
// sudah terverifikasi. Semua komponen bisa intip dompet ini
// tanpa harus tanya ke server berulang kali.
//
// Menggunakan Zustand — library state management yang ringan.
// Analogi Zustand: seperti papan pengumuman global —
// siapapun bisa baca, dan siapapun bisa update. Semua yang
// langganan (subscribe) otomatis dapat update terbaru.
//
// Relasi:
//   - authStore → pakai authService untuk aksi login/logout/me
//   - authStore → dibaca oleh useAuth hook
//   - authStore → dibaca oleh middleware.js (cek role)
//   - authStore → dibaca oleh Navbar (tampilkan nama user)
// ============================================================

import { create } from "zustand";
import authService from "@/services/authService";

const useAuthStore = create((set, get) => ({
  // ============================================================
  // STATE — data yang disimpan di "dompet"
  // ============================================================

  // Data user yang sedang login. null = belum login
  // Selalu mulai null agar SSR dan client render sama (tidak hydration mismatch)
  user: null,

  // Apakah sedang ada request (login/logout/fetchMe)
  // Digunakan untuk tampilkan spinner loading
  isLoading: false,

  // Pesan error terakhir (misal: "Email atau password salah")
  error: null,

  // ============================================================
  // COMPUTED — nilai turunan dari state (bukan state sendiri)
  // ============================================================

  // Apakah user sudah login? (ada token di localStorage)
  // Analogi: cek apakah ada KTP di dompet
  get isAuthenticated() {
    return authService.hasToken() && get().user !== null;
  },

  // ============================================================
  // ACTIONS — fungsi untuk mengubah state
  // Analogi: tombol-tombol di panel kontrol
  // ============================================================

  // --- LOGIN ---
  // Kirim credentials ke server, simpan token + user ke state
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      // Simpan data user ke state global (semua komponen langsung tau siapa yang login)
      set({ user: data.user, isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.message ?? "Login gagal", isLoading: false });
      throw err;
    }
  },

  // --- REGISTER ---
  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(payload);
      set({ user: data.user, isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.message ?? "Registrasi gagal", isLoading: false });
      throw err;
    }
  },

  // --- LOGOUT ---
  // Batalkan token di server, lalu kosongkan state
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      // Kosongkan "dompet" — apapun yang terjadi di server
      set({ user: null, isLoading: false, error: null });
    }
  },

  // --- FETCH USER DARI SERVER ---
  // Dipanggil saat aplikasi pertama dibuka — verifikasi apakah token masih valid
  // Analogi: saat masuk kantor, satpam scan kartu akses untuk memastikan masih aktif
  fetchCurrentUser: async () => {
    if (!authService.hasToken()) return;   // Tidak ada token = tidak perlu cek
    set({ isLoading: true });
    try {
      const user = await authService.me();
      set({ user, isLoading: false });
    } catch {
      // Token tidak valid — bersihkan state (axios interceptor sudah redirect ke /login)
      set({ user: null, isLoading: false });
    }
  },

  // --- HYDRATE DARI LOCALSTORAGE (dipanggil sekali di client setelah mount) ---
  hydrateFromStorage: () => {
    const user = authService.getStoredUser();
    if (user) set({ user });
  },

  // --- UPDATE STATE USER LOKAL ---
  // Digunakan setelah update profil — supaya nama/data di navbar ikut berubah
  // tanpa perlu fetch ulang dari server
  setUser: (user) => set({ user }),

  // --- BERSIHKAN ERROR ---
  clearError: () => set({ error: null }),

  // --- HELPER ROLE ---
  // Cek apakah user punya role tertentu
  // Analogi: cek jabatan di KTP — apakah ini direktur (admin) atau pegawai (kasir)?
  isAdmin:  () => get().user?.role === "admin",
  isKasir:  () => get().user?.role === "kasir",
  hasRole:  (role) => get().user?.role === role,

  // Role admin atau kasir (keduanya bisa akses dashboard)
  isStaff: () => ["admin", "kasir"].includes(get().user?.role),

  // Developer email — selalu punya akses enterprise penuh
  isDeveloper: () => get().user?.email === "donojomi@gmail.com",

  // Cek apakah user bisa akses AI sidebar
  // Admin role ATAU developer email ATAU subscription pro/enterprise
  canAccessAI: () => {
    const user = get().user;
    if (!user) return false;
    if (user.email === "donojomi@gmail.com") return true;
    if (user.role === "admin") return true;
    const plan = user.subscription_plan ?? "free";
    return plan === "pro" || plan === "enterprise";
  },

  // Dapatkan subscription plan efektif (developer selalu enterprise)
  getEffectivePlan: () => {
    const user = get().user;
    if (!user) return "free";
    if (user.email === "donojomi@gmail.com") return "enterprise";
    return user.subscription_plan ?? "free";
  },
}));

export default useAuthStore;
