"use client";

// ============================================================
// Reset Password — Halaman ganti password pakai link dari email
// Analogi: Ini seperti "ruang ganti kunci kantor" — user datang
// dengan surat izin (link dari email), lalu boleh mengganti kunci
// (password) dengan yang baru.
//
// Alur:
//   1. User klik link di email → masuk ke halaman ini
//      URL berisi: ?token=xxxx&email=user@email.com
//   2. User isi password baru + konfirmasi → POST /api/reset-password
//   3. Server cek token masih valid (60 menit, sekali pakai)
//   4. Berhasil → user login dengan password baru
// ============================================================

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LogoMark from "@/components/brand/LogoMark";
import authService from "@/services/authService";
import { getErrorMessage } from "@/lib/utils";

function ResetForm() {
  // ── State ──
  // token & email diambil dari URL (?token=...&email=...) yang dikirim
  // lewat link di email — kalau kosong berarti link dibuka manual
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [form, setForm]     = useState({ password: "", password_confirmation: "" });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [error, setError]   = useState("");

  /**
   * handleChange — Update nilai input password; reset pesan error.
   */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  /**
   * handleSubmit — Validasi lokal (konfirmasi cocok & min 8 karakter) lalu
   * kirim token + email + password baru ke POST /api/reset-password.
   * Token sekali pakai — berhasil berarti semua sesi lama dicabut.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.password_confirmation) {
      setError("Password dan konfirmasi tidak cocok.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setStatus("submitting");
    try {
      await authService.resetPassword({ email, token, ...form });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(getErrorMessage(err));
    }
  };

  // ── Render: 3 kondisi — sukses | link tidak valid | form ganti password ──
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <LogoMark size={48} />
          <span className="font-black text-3xl font-grotesk">KasirAI</span>
        </div>

        <div className="bg-white border-3 border-brand-black p-8" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
          {status === "success" ? (
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
          ) : !token || !email ? (
            <>
              {/* Link tidak lengkap — bisa jadi dibuka manual tanpa token */}
              <h1 className="font-black text-2xl font-grotesk mb-3">Link Tidak Valid</h1>
              <p className="text-sm text-brand-black/60 font-medium mb-6 leading-relaxed">
                Link reset password tidak lengkap. Pakai link yang dikirim lewat email,
                atau minta link baru di halaman lupa password.
              </p>
              <Link
                href="/forgot-password"
                className="block w-full text-center py-3 bg-brand-yellow border-2 border-brand-black font-black text-base hover:bg-yellow-300 transition-colors"
                style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
              >
                Minta Link Baru →
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-black text-2xl font-grotesk mb-1">Buat Password Baru</h1>
              <p className="text-sm text-brand-black/50 font-medium mb-6">
                Untuk akun <strong>{email}</strong> · Link berlaku 60 menit dan sekali pakai
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold">Password Baru <span className="text-red-500">*</span></label>
                  <input
                    name="password" type="password" required
                    value={form.password} onChange={handleChange}
                    placeholder="min. 8 karakter"
                    className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold">Konfirmasi Password <span className="text-red-500">*</span></label>
                  <input
                    name="password_confirmation" type="password" required
                    value={form.password_confirmation} onChange={handleChange}
                    placeholder="ulangi password baru"
                    className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full py-3 bg-brand-yellow border-2 border-brand-black font-black text-base disabled:opacity-50 hover:bg-yellow-300 transition-colors"
                  style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
                >
                  {status === "submitting" ? "Menyimpan..." : "Ganti Password →"}
                </button>
              </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}