"use client";

// ============================================================
// Login Page, Halaman masuk ke sistem
// Analogi: Ini seperti "pintu masuk kantor", setiap karyawan
// harus scan ID (email+password) sebelum boleh masuk ke ruang kerja.
//
// Alur:
//   1. User isi form → klik Masuk
//   2. authStore.login() → kirim ke POST /api/login
//   3. Server validasi → kirim token Sanctum
//   4. Token simpan di localStorage → redirect ke /dashboard
//
// Enhancement: Turtle pet loading overlay saat Render backend cold-starting.
// Overlay menampilkan animasi kura-kura berjalan + tips berganti +
// progress bar animatif supaya user sabar menunggu server bangun.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/stores/authStore";
import { getErrorMessage } from "@/lib/utils";
import LogoMark from "@/components/brand/LogoMark";
import {
  CheckCircle2,
} from "lucide-react";

// Status text yang bertahap selama inisialisasi server
const LOADING_PHASES = [
  "Menghubungkan ke cloud server...",
  "Memverifikasi database & enkripsi sesi...",
  "Menyiapkan modul kasir & inventori...",
  "Sistem siap, membuka ruang masuk...",
];

// Konfigurasi partikel melayang
const PARTICLES = [
  { left: "10%", bottom: "-20px", w: 14, h: 14, bg: "#FFE500", delay: 0, dur: 4 },
  { left: "25%", bottom: "-30px", w: 10, h: 10, bg: "#00C27C", delay: 0.8, dur: 3.5 },
  { left: "42%", bottom: "-15px", w: 18, h: 18, bg: "#FF7AB6", delay: 1.6, dur: 5 },
  { left: "60%", bottom: "-25px", w: 12, h: 12, bg: "#0066FF", delay: 0.4, dur: 4.2 },
  { left: "75%", bottom: "-10px", w: 16, h: 16, bg: "#8B5CF6", delay: 2.0, dur: 3.8 },
  { left: "88%", bottom: "-35px", w: 11, h: 11, bg: "#FFE500", delay: 1.2, dur: 4.5 },
  { left: "5%",  bottom: "-40px", w: 8,  h: 8,  bg: "#FF3B3B", delay: 2.4, dur: 3.2 },
  { left: "50%", bottom: "-18px", w: 13, h: 13, bg: "#00C27C", delay: 0.6, dur: 4.8 },
];

// ======================================================
// LoadingOverlay, Full-screen 3D loading saat cold-start
// ======================================================
function LoadingOverlay({ visible, onExitComplete }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Fase status bertahap: ganti tiap 2.6 detik
  useEffect(() => {
    if (!visible && !exiting) return;
    const t = setInterval(() => {
      setPhaseIdx((i) => Math.min(i + 1, LOADING_PHASES.length - 1));
    }, 2600);
    return () => clearInterval(t);
  }, [visible, exiting]);

  // Saat server warm (visible → false), trigger exit animation
  useEffect(() => {
    if (!visible && !exiting) {
      setExiting(true);
      const t = setTimeout(() => {
        setExiting(false);
        onExitComplete?.();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [visible, exiting, onExitComplete]);

  if (!visible && !exiting) return null;

  return (
    <div
      className={exiting ? "loading-overlay-exit" : ""}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "#FFFBEB",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "28px",
        overflow: "hidden",
      }}
    >
      {/* Background grid pattern */}
      <div className="bg-grid" aria-hidden="true" />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="loading-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.w,
            height: p.h,
            background: p.bg,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <LogoMark size={38} />
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: "26px",
            letterSpacing: "-0.5px",
          }}
        >
          SiKasir AI
        </span>
      </motion.div>

      {/* 3D Isometric Server & Database Core */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.2 }}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 2,
        }}
      >
        {/* Turtle Pet Loading */}
        <div className="turtle-pet-container">
          {/* Speech bubble */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="turtle-speech-bubble"
          >
            <span className="turtle-speech-text">Loading...</span>
            <span className="turtle-speech-dots">
              <span className="turtle-dot" style={{ animationDelay: "0s" }} />
              <span className="turtle-dot" style={{ animationDelay: "0.2s" }} />
              <span className="turtle-dot" style={{ animationDelay: "0.4s" }} />
            </span>
          </motion.div>

          {/* Video frame with neobrutalist border */}
          <div className="turtle-video-frame">
            <video
              src="/landing/Pond turtle walking.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="turtle-video"
            />
            {/* Watermark cover overlay */}
            <div className="turtle-watermark-cover" />
          </div>

          {/* Walking indicator dots */}
          <div className="turtle-walk-dots">
            <span className="walk-dot" style={{ animationDelay: "0s" }} />
            <span className="walk-dot" style={{ animationDelay: "0.3s" }} />
            <span className="walk-dot" style={{ animationDelay: "0.6s" }} />
          </div>
        </div>
      </motion.div>

      {/* Status Phase & Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Phase Text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={phaseIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "17px",
              color: "#0A0A0A",
              textAlign: "center",
            }}
          >
            {LOADING_PHASES[phaseIdx]}
          </motion.p>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="loading-progress-track" style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
          <div className="loading-progress-bar" />
        </div>

        {/* Subtext (Natural, Professional, No Slop) */}
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10.5px",
            fontWeight: 600,
            color: "#666",
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: "380px",
          }}
        >
          Sedang menginisialisasi cloud server (sekitar ~15–25 detik saat pertama kali diakses).
          <br />
          Terima kasih telah menunggu dengan sabar.
        </p>
      </motion.div>
    </div>
  );
}

// ======================================================
// LoginPage, Halaman login utama
// ======================================================
export default function LoginPage() {
  // ── State ──
  // form: nilai input email & password · error: pesan gagal login
  // serverWarm: indikator backend sudah siap dijawab (anti cold start Render)
  const { login, isLoading } = useAuthStore();

  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [serverWarm, setServerWarm] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // ── Efek saat halaman terbuka ──
  // Ping backend saat halaman login terbuka supaya Render "bangun"
  // sebelum user klik tombol Masuk, mengurangi cold start delay
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, { method: "GET" })
      .then(() => setServerWarm(true))
      .catch(() => setServerWarm(true));
  }, []);

  // Callback saat overlay selesai exit animation
  const handleOverlayExit = useCallback(() => {
    setShowOverlay(false);
  }, []);

  /**
   * handleChange, Update nilai input form sesuai field yang diketik.
   * Error lama di-reset supaya pesan merah hilang begitu user mengetik ulang.
   */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  /**
   * handleSubmit, Kirim kredensial ke authStore.login().
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

  // ── Render: overlay loading + logo + kartu form + link bantuan ──
  return (
    <>
      {/* 3D Loading overlay saat server belum warm */}
      {showOverlay && (
        <LoadingOverlay
          visible={!serverWarm}
          onExitComplete={handleOverlayExit}
        />
      )}

      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
        {/* ── Kartu login ── */}
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: serverWarm ? 1 : 0.3, y: serverWarm ? 0 : 20 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        >

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

              {/* Lupa password, link ke halaman minta link reset */}
              <div className="flex justify-end -mt-2">
                <Link href="/forgot-password" className="text-xs font-bold text-brand-black/60 hover:text-brand-black underline underline-offset-2 transition-colors">
                  Lupa password?
                </Link>
              </div>

              {/* Status server — shown only if overlay already gone but server still cold */}
              {!serverWarm && !showOverlay && (
                <p className="text-[11px] text-brand-black/40 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block" />
                  Menghubungkan ke server...
                </p>
              )}

              {/* Server ready indicator */}
              {serverWarm && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-green-600 font-mono flex items-center gap-1.5 font-semibold"
                >
                  <CheckCircle2 size={12} color="#00C27C" />
                  Server cloud siap
                </motion.p>
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
        </motion.div>
      </div>
    </>
  );
}
