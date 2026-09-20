"use client";

// ============================================================
// Forgot Password, Lupa password via kode OTP 6 digit
// Analogi: seperti PIN sekali pakai di loket bank. Kamu sebut nama
// (email), kami kirim PIN ke email itu, lalu kamu ketik PIN + password
// baru di loket yang sama. PIN berlaku 10 menit dan hangus kalau salah
// 5 kali.
//
// Alur (satu halaman, 3 tahap):
//   1. "email"  → isi email → POST /api/forgot-password (kirim OTP)
//   2. "verify" → isi OTP + password baru → POST /api/reset-password
//   3. "done"   → sukses, arahkan ke login
//
// Catatan keamanan: server selalu membalas sukses walau email tidak
// terdaftar (anti user-enumeration), jadi tahap 2 selalu tampil.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import LogoMark from "@/components/brand/LogoMark";
import authService from "@/services/authService";
import { getErrorMessage } from "@/lib/utils";

const RESEND_SECONDS = 60; // sama dengan jeda kirim ulang di backend

const inputClass =
  "w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow";
const primaryBtn =
  "w-full py-3 bg-brand-yellow border-2 border-brand-black font-black text-base disabled:opacity-50 hover:bg-yellow-300 transition-colors";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("email"); // email | verify | done
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ otp: "", password: "", password_confirmation: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Hitung mundur tombol "Kirim ulang kode"
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  /** Minta OTP (tahap 1, dan juga dipakai tombol "Kirim ulang kode"). */
  const requestOtp = async () => {
    setBusy(true);
    setError("");
    try {
      await authService.forgotPassword(email.trim());
      setStep("verify");
      setCountdown(RESEND_SECONDS);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    requestOtp();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Kolom kode: hanya angka, maksimal 6 digit
    const next = name === "otp" ? value.replace(/\D/g, "").slice(0, 6) : value;
    setForm((prev) => ({ ...prev, [name]: next }));
    setError("");
  };

  /** Verifikasi OTP + ganti password (tahap 2). */
  const handleResetSubmit = async (e) => {
    e.preventDefault();

    if (form.otp.length !== 6) {
      setError("Kode harus 6 digit.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError("Password dan konfirmasi tidak cocok.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await authService.resetPassword({ email: email.trim(), ...form });
      setStep("done");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <LogoMark size={48} />
          <span className="font-black text-3xl font-grotesk">KasirAI</span>
        </div>

        <div className="bg-white border-3 border-brand-black p-8" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
          {step === "done" && (
            <>
              <h1 className="font-black text-2xl font-grotesk mb-3">Password Berhasil Diganti</h1>
              <p className="text-sm text-brand-black/60 font-medium mb-6 leading-relaxed">
                Semua sesi login lama sudah dicabut demi keamanan. Silakan masuk dengan
                password baru kamu.
              </p>
              <Link
                href="/login"
                className="block w-full text-center py-3 bg-brand-yellow border-2 border-brand-black font-black text-base hover:bg-yellow-300 transition-colors"
                style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
              >
                Masuk Sekarang →
              </Link>
            </>
          )}

          {step === "email" && (
            <>
              <h1 className="font-black text-2xl font-grotesk mb-1">Lupa Password?</h1>
              <p className="text-sm text-brand-black/50 font-medium mb-6">
                Masukkan email yang kamu pakai saat daftar. Kami akan kirim kode 6 digit
                untuk membuat password baru.
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold">Email <span className="text-red-500">*</span></label>
                  <input
                    name="email" type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className={inputClass}
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  />
                </div>

                <button type="submit" disabled={busy} className={primaryBtn} style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
                  {busy ? "Mengirim kode..." : "Kirim Kode →"}
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

          {step === "verify" && (
            <>
              <h1 className="font-black text-2xl font-grotesk mb-1">Masukkan Kode</h1>
              <p className="text-sm text-brand-black/60 font-medium mb-4 leading-relaxed">
                Kalau <strong>{email}</strong> terdaftar di KasirAI, kami sudah mengirim kode
                6 digit. Kode berlaku <strong>10 menit</strong> dan hangus kalau salah 5 kali.
              </p>
              <div className="mb-5 px-4 py-3 bg-yellow-50 border-2 border-brand-black/20 text-xs font-semibold text-brand-black/70">
                Tidak terlihat? Cek folder <strong>Spam</strong> atau <strong>Promosi</strong>.
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold">Kode 6 Digit <span className="text-red-500">*</span></label>
                  <input
                    name="otp" type="text" required
                    inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                    value={form.otp} onChange={handleChange}
                    placeholder="123456"
                    className={`${inputClass} text-center text-2xl font-black tracking-[0.5em] font-mono`}
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold">Password Baru <span className="text-red-500">*</span></label>
                  <input
                    name="password" type="password" required autoComplete="new-password"
                    value={form.password} onChange={handleChange}
                    placeholder="min. 8 karakter"
                    className={inputClass}
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold">Konfirmasi Password <span className="text-red-500">*</span></label>
                  <input
                    name="password_confirmation" type="password" required autoComplete="new-password"
                    value={form.password_confirmation} onChange={handleChange}
                    placeholder="ulangi password baru"
                    className={inputClass}
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  />
                </div>

                <button type="submit" disabled={busy} className={primaryBtn} style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
                  {busy ? "Menyimpan..." : "Ganti Password →"}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={busy || countdown > 0}
                  className="font-black underline underline-offset-2 disabled:opacity-40 disabled:no-underline"
                >
                  {countdown > 0 ? `Kirim ulang kode (${countdown}s)` : "Kirim ulang kode"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setForm({ otp: "", password: "", password_confirmation: "" });
                    setError("");
                  }}
                  className="font-semibold text-brand-black/60 hover:text-brand-black"
                >
                  Ganti email
                </button>
              </div>
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
