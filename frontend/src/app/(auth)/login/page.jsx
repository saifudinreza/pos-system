"use client";

// ============================================================
// Login Page — Halaman masuk ke sistem
// Analogi: Ini seperti "pintu masuk kantor" — setiap karyawan
// harus scan ID (email+password) sebelum boleh masuk ke ruang kerja.
//
// Alur:
//   1. User isi form → klik Masuk
//   2. authStore.login() → kirim ke POST /api/login
//   3. Server validasi → kirim token Sanctum
//   4. Token simpan di localStorage → redirect ke /dashboard
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import { getErrorMessage } from "@/lib/utils";
import LogoMark from "@/components/brand/LogoMark";

export default function LoginPage() {
  // ── State ──
  // form: nilai input email & password · error: pesan gagal login
  // serverWarm: indikator backend sudah siap dijawab (anti cold start Railway)
  const { login, isLoading } = useAuthStore();

  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [serverWarm, setServerWarm] = useState(false);

  // ── Efek saat halaman terbuka ──
  // Ping backend saat halaman login terbuka supaya Railway "bangun"
  // sebelum user klik tombol Masuk — mengurangi cold start delay
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, { method: "GET" })
      .then(() => setServerWarm(true))
      .catch(() => setServerWarm(true));
  }, []);

  /**
   * handleChange — Update nilai input form sesuai field yang diketik.
   * Error lama di-reset supaya pesan merah hilang begitu user mengetik ulang.
   */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  /**
   * handleSubmit — Kirim kredensial ke authStore.login().
   * Berhasil → redirect ke /dashboard (full reload via window.location
   * supaya middleware auth Next.js ikut re-evaluasi token baru).
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // ── Render: logo + kartu form + link bantuan ──
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      {/* ── Kartu login ── */}
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <LogoMark size={48} />
          <span className="font-black text-3xl font-grotesk">KasirAI</span>
        </div>

        {/* Form box */}
        <div
          className="bg-white border-3 border-brand-black p-8"
          style={{ boxShadow: "6px 6px 0 #0A0A0A" }}
        >
          <h1 className="font-black text-2xl font-grotesk mb-1">Masuk</h1>
          <p className="text-sm text-brand-black/50 font-medium mb-6">
            Masukkan akun kamu untuk melanjutkan
          </p>

          {/* Error global */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold">Email <span className="text-red-500">*</span></label>
              <input
                name="email" type="email" required
                value={form.email} onChange={handleChange}
                placeholder="nama@email.com"
                className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold">Password <span className="text-red-500">*</span></label>
              <input
                name="password" type="password" required
                value={form.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              />
            </div>

            {/* Lupa password — link ke halaman minta link reset */}
            <div className="flex justify-end -mt-2">
              <Link href="/forgot-password" className="text-xs font-bold text-brand-black/60 hover:text-brand-black underline underline-offset-2 transition-colors">
                Lupa password?
              </Link>
            </div>

            {/* Status server */}
            {!serverWarm && (
              <p className="text-[11px] text-brand-black/40 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block" />
                Menghubungkan ke server...
              </p>
            )}

            {/* Tombol submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-yellow border-2 border-brand-black font-black text-base disabled:opacity-50 hover:bg-yellow-300 transition-colors"
              style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
            >
              {isLoading ? "Masuk..." : "Masuk →"}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-brand-black/60">
            Belum punya akun?{" "}
            <Link href="/register" className="font-black text-brand-black underline underline-offset-2">
              Daftar sekarang
            </Link>
          </p>
        </div>

        {/* Link kembali ke landing */}
        <p className="text-center mt-4">
          <Link href="/" className="text-xs font-semibold text-brand-black/40 hover:text-brand-black transition-colors">
            ← Kembali ke halaman utama
          </Link>
        </p>
      </div>
    </div>
  );
}
