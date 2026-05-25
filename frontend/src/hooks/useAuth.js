"use client";

// ============================================================
// useAuth.js — Hook autentikasi siap pakai untuk komponen
//
// Analogi: Ini seperti "remote control" untuk authStore —
// komponen tidak perlu tau detail implementasi authStore,
// cukup panggil hook ini dan dapat semua yang dibutuhkan.
//
// Kenapa pakai hook dibanding langsung pakai store?
// - Hook bisa tambahkan logika tambahan (navigasi setelah login, dll)
// - Komponen jadi lebih bersih — tidak perlu import banyak hal
// - Mudah di-mock saat testing
//
// Cara pakai di komponen:
//   const { user, isAdmin, login, logout, isLoading } = useAuth();
// ============================================================

import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";

export function useAuth() {
  const router = useRouter();

  // Ambil semua state & action dari authStore
  const {
    user,
    isLoading,
    error,
    login:         loginStore,
    register:      registerStore,
    logout:        logoutStore,
    fetchCurrentUser,
    setUser,
    clearError,
    isAdmin,
    isKasir,
    isStaff,
    hasRole,
  } = useAuthStore();

  // Apakah sudah login — cek ada user dan ada token
  const isAuthenticated = !!user;

  // --- LOGIN + REDIRECT ---
  // Setelah login sukses, arahkan ke dashboard
  // Analogi: setelah masuk pintu (login), langsung arahkan ke ruang kerja
  const login = async (credentials) => {
    const data = await loginStore(credentials);
    // Redirect ke dashboard setelah berhasil
    router.push("/dashboard");
    return data;
  };

  // --- REGISTER + REDIRECT ---
  const register = async (payload) => {
    const data = await registerStore(payload);
    router.push("/dashboard");
    return data;
  };

  // --- LOGOUT + REDIRECT ---
  // Setelah logout, arahkan ke halaman login
  const logout = async () => {
    await logoutStore();
    router.push("/login");
  };

  return {
    // State
    user,
    isLoading,
    error,
    isAuthenticated,

    // Peran / role
    isAdmin:  isAdmin(),
    isKasir:  isKasir(),
    isStaff:  isStaff(),
    hasRole,

    // Aksi
    login,
    register,
    logout,
    fetchCurrentUser,
    setUser,
    clearError,
  };
}
