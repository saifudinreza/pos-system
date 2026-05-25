"use client";

// Register Page — Halaman pendaftaran akun baru
// Analogi: seperti "formulir keanggotaan" — isi data diri,
// langsung aktif dan dapat kartu member (token)

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { getErrorMessage } from "@/lib/utils";

export default function RegisterPage() {
  const router   = useRouter();
  const { register, isLoading } = useAuthStore();

  const [form, setForm]     = useState({ name: "", email: "", phone: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validasi konfirmasi password di frontend sebelum kirim ke server
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: "Password tidak cocok" });
      return;
    }

    try {
      await register(form);
      router.push("/dashboard");
    } catch (err) {
      // Error validasi Laravel datang dalam format { errors: { field: ["msg"] } }
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setErrors({ _global: getErrorMessage(err) });
    }
  };

  const Field = ({ name, label, type = "text", placeholder }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold">{label} {name !== "phone" && <span className="text-red-500">*</span>}</label>
      <input
        name={name} type={type} required={name !== "phone"}
        value={form[name]} onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 text-sm border-2 outline-none transition-colors
          ${errors[name] ? "border-red-500" : "border-brand-black focus:border-brand-yellow"}`}
        style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
      />
      {errors[name] && <p className="text-xs text-red-500 font-semibold">{Array.isArray(errors[name]) ? errors[name][0] : errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-brand-yellow border-3 border-brand-black flex items-center justify-center font-black text-2xl"
            style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>K</div>
          <span className="font-black text-3xl font-grotesk">KasirAI</span>
        </div>

        <div className="bg-white border-3 border-brand-black p-8" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
          <h1 className="font-black text-2xl font-grotesk mb-1">Daftar Akun</h1>
          <p className="text-sm text-brand-black/50 font-medium mb-6">Mulai coba gratis 14 hari</p>

          {errors._global && (
            <div className="mb-4 px-4 py-3 bg-red-50 border-2 border-red-400 text-red-700 text-sm font-semibold">
              {errors._global}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field name="name"     label="Nama Lengkap" placeholder="Budi Santoso" />
            <Field name="email"    label="Email"        type="email" placeholder="budi@email.com" />
            <Field name="phone"    label="No. HP (opsional)" placeholder="08xxxxxxxxxx" />
            <Field name="password" label="Password"     type="password" placeholder="min. 8 karakter" />
            <Field name="password_confirmation" label="Konfirmasi Password" type="password" placeholder="ulangi password" />

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 bg-brand-yellow border-2 border-brand-black font-black text-base disabled:opacity-50 hover:bg-yellow-300 transition-colors"
              style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
            >
              {isLoading ? "Mendaftar..." : "Daftar Sekarang →"}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-brand-black/60">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-black text-brand-black underline underline-offset-2">Masuk</Link>
          </p>
        </div>

        <p className="text-center mt-4">
          <Link href="/" className="text-xs font-semibold text-brand-black/40 hover:text-brand-black transition-colors">
            ← Kembali ke halaman utama
          </Link>
        </p>
      </div>
    </div>
  );
}
