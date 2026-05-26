"use client";

import { useState } from "react";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import { getErrorMessage } from "@/lib/utils";

// Field HARUS di luar RegisterPage — kalau di dalam, tiap keystroke React
// buat instance baru → input di-remount → focus hilang setiap ketik
const Field = ({ name, label, type = "text", placeholder, value, onChange, error }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-bold">
      {label} {name !== "phone" && <span className="text-red-500">*</span>}
    </label>
    <input
      name={name} type={type} required={name !== "phone"}
      value={value} onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 text-sm border-2 outline-none transition-colors
        ${error ? "border-red-500" : "border-brand-black focus:border-brand-yellow"}`}
      style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
    />
    {error && (
      <p className="text-xs text-red-500 font-semibold">
        {Array.isArray(error) ? error[0] : error}
      </p>
    )}
  </div>
);

export default function RegisterPage() {
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

    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: "Password tidak cocok" });
      return;
    }

    try {
      await register(form);
      window.location.href = "/dashboard";
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setErrors({ _global: getErrorMessage(err) });
    }
  };

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
            <Field name="name"     label="Nama Lengkap"           placeholder="Budi Santoso"    value={form.name}                  onChange={handleChange} error={errors.name} />
            <Field name="email"    label="Email"       type="email" placeholder="budi@email.com" value={form.email}                onChange={handleChange} error={errors.email} />
            <Field name="phone"    label="No. HP (opsional)"       placeholder="08xxxxxxxxxx"    value={form.phone}                 onChange={handleChange} error={errors.phone} />
            <Field name="password" label="Password"   type="password" placeholder="min. 8 karakter" value={form.password}         onChange={handleChange} error={errors.password} />
            <Field name="password_confirmation" label="Konfirmasi Password" type="password" placeholder="ulangi password" value={form.password_confirmation} onChange={handleChange} error={errors.password_confirmation} />

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
