"use client";

// ============================================================
// Forgot Password — Halaman minta link reset password
// Analogi: Ini seperti "pintu cadangan" saat kunci kantor hilang —
// user cukup isi email, sistem kirim "kunci baru" (link reset) ke email itu.
//
// Alur:
//   1. User isi email → klik "Kirim Link Reset"
//   2. Kirim ke POST /api/forgot-password
//   3. Server kirim email berisi link (berlaku 60 menit, sekali pakai)
//   4. User buka link → diarahkan ke halaman reset password
//
// Catatan keamanan: server selalu membalas pesan yang sama walau email
// tidak terdaftar — supaya orang jahat tidak bisa "memancing" email mana
// yang punya akun. Dari sisi user: kalau email terdaftar, link akan datang.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import LogoMark from "@/components/brand/LogoMark";
import authService from "@/services/authService";
import { getErrorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  // ── State ──
  // status: idle | sending | sent | error — menggerakkan tampilan form/sukses
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  /**
   * handleSubmit — Minta link reset via POST /api/forgot-password.
   * Server selalu balas sukses walau email tidak terdaftar (anti
   * user-enumeration) — jadi di sini langsung tampilkan state "sent".
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await authService.forgotPassword(email.trim());
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(getErrorMessage(err));
    }
  };

  // ── Render: dua kondisi — sudah terkirim (sent) vs form input ──
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <LogoMark size={48} />
          <span className="font-black text-3xl font-grotesk">KasirAI</span>
        </div>

        <div className="bg-white border-3 border-brand-black p-8" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
          {status === "sent" ? (
            <>
              {/* Status sukses: link sudah dikirim */}
              <h1 className="font-black text-2xl font-grotesk mb-3">Cek Email Kamu</h1>
              <p className="text-sm text-brand-black/60 font-medium mb-6 leading-relaxed">
                Kalau email <strong>{email}</strong> terdaftar di KasirAI, kami sudah
                mengirim link reset password. Link berlaku <strong>60 menit</strong> dan
                hanya bisa dipakai <strong>sekali</strong>.
              </p>
              <div className="mb-6 px-4 py-3 bg-yellow-50 border-2 border-brand-black/20 text-xs font-semibold text-brand-black/70">
                Tidak terlihat? Cek folder <strong>Spam</strong> atau <strong>Promosi</strong>.
              </div>
              <button
                onClick={() => setStatus("idle")}
                className="w-full py-3 bg-white border-2 border-brand-black font-black text-base hover:bg-brand-cream transition-colors"
                style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
              >
                Kirim ulang ke email lain
              </button>
            </>
          ) : (
            <>
              <h1 className="font-black text-2xl font-grotesk mb-1">Lupa Password?</h1>
              <p className="text-sm text-brand-black/50 font-medium mb-6">
                Masukkan email yang kamu pakai saat daftar. Kami akan kirim link untuk
                membuat password baru.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold">Email <span className="text-red-500">*</span></label>
                  <input
                    name="email" type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full py-3 bg-brand-yellow border-2 border-brand-black font-black text-base disabled:opacity-50 hover:bg-yellow-300 transition-colors"
                  style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
                >
                  {status === "sending" ? "Mengirim link..." : "Kirim Link Reset →"}
                </button>
              </form>

              <p className="mt-5 text-sm text-center text-brand-black/60">
                Baru ingat passwordnya?{" "}
                <Link href="/login" className="font-black text-brand-black underline underline-offset-2">
                  Masuk
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center mt-4">
          <Link href="/login" className="text-xs font-semibold text-brand-black/40 hover:text-brand-black transition-colors">
            ← Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </div>
  );
}