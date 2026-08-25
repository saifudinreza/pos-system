"use client";

// ============================================================
// Register Page, Halaman pendaftaran akun baru
//
// Alur:
//   1. User isi form (nama, toko, email, HP, password)
//   2. Saat mengetik "Nama Toko" → cek ke GET /api/check-tenant
//      (debounce 500ms): nama toko sudah ada = "bergabung ke toko"
//      (role Kasir), nama baru = "buat toko sendiri" (role Admin)
//   3. POST /api/register via authStore.register()
//   4. Kalau daftar dari landing dengan ?plan=pro|enterprise →
//      redirect ke /upgrade, selain itu ke /dashboard
// ============================================================

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import LogoMark from "@/components/brand/LogoMark";
import { useSearchParams } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { getErrorMessage } from "@/lib/utils";
import api from "@/lib/axios";

// ── Input Field component ────────────────────────────────────
/**
 * Field, Input form terstandar (label, input, pesan error).
 * error bisa string biasa atau array (dari validasi Laravel), array
 * diambil elemen pertamanya.
 */
const Field = ({ name, label, type = "text", placeholder, value, onChange, error, required = true }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-bold">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      name={name} type={type} required={required}
      value={value} onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 text-sm border-2 outline-none transition-colors rounded-md
        ${error ? "border-red-500" : "border-brand-black focus:border-brand-yellow"}`}
      style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
    />
    {error && <p className="text-xs text-red-500 font-semibold">{Array.isArray(error) ? error[0] : error}</p>}
  </div>
);

// ── Tenant status indicator ───────────────────────────────────
/**
 * TenantStatus, Info real-time di bawah input Nama Toko:
 *   checking → "memeriksa..." · join → toko ditemukan (bergabung)
 *   new      → nama baru (buat toko sendiri) · selain itu → null (kosong)
 */
function TenantStatus({ status, tenantInfo }) {
  if (status === "checking") return (
    <div className="flex items-center gap-1.5 text-[11px] text-brand-black/40 font-mono mt-1">
      <span className="w-1.5 h-1.5 bg-brand-black/30 rounded-full animate-pulse" />
      Memeriksa nama toko...
    </div>
  );

  if (status === "join") return (
    <div className="mt-1 px-3 py-2 rounded-md bg-blue-50 border-2 border-blue-400 flex items-start gap-2">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
      <div>
        <p className="text-xs font-black text-blue-700">Bergabung ke toko yang sudah ada</p>
        <p className="text-[11px] text-blue-600 font-mono">
          Toko <strong>"{tenantInfo?.name}"</strong> ditemukan · {tenantInfo?.member_count} anggota · Kamu masuk sebagai <strong>Kasir</strong>
        </p>
      </div>
    </div>
  );

  if (status === "new") return (
    <div className="mt-1 px-3 py-2 rounded-md bg-green-50 border-2 border-green-400 flex items-start gap-2">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
      <div>
        <p className="text-xs font-black text-green-700">Membuat toko baru</p>
        <p className="text-[11px] text-green-600 font-mono">Kamu akan menjadi <strong>Admin</strong> dari toko ini</p>
      </div>
    </div>
  );

  return null;
}

function RegisterForm() {
  // ── State ──
  // tenantStatus: null | "checking" | "join" | "new", hasil cek nama toko
  // tenantInfo: data tenant kalau nama toko ternyata sudah dipakai
  const { register, isLoading } = useAuthStore();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "free";

  const [form, setForm]     = useState({ name: "", email: "", phone: "", store_name: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [tenantStatus, setTenantStatus] = useState(null); // null | "checking" | "join" | "new"
  const [tenantInfo, setTenantInfo]     = useState(null);
  const debounceRef = useRef(null);

  /**
   * handleChange, Update form + reset error field yang sedang diketik.
   * Khusus "store_name": cek ketersediaan tenant via API dengan debounce
   * 500ms (debounceRef) supaya tidak spam request per keystroke.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "store_name") {
      const trimmed = value.trim();
      if (trimmed.length < 2) { setTenantStatus(null); setTenantInfo(null); return; }

      setTenantStatus("checking");
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await api.get(`/check-tenant?name=${encodeURIComponent(trimmed)}`);
          if (data.exists) {
            setTenantStatus("join");
            setTenantInfo(data.tenant);
          } else {
            setTenantStatus("new");
            setTenantInfo(null);
          }
        } catch {
          setTenantStatus(null);
        }
      }, 500);
    }
  };

  // Bersihkan timer debounce kalau komponen di-unmount (hindari setState
  // setelah komponen hilang dari layar)
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  /**
   * handleSubmit, Validasi lokal (konfirmasi password cocok) lalu kirim
   * ke authStore.register(). Kalau daftar karena klik paket berbayar di
   * landing (?plan=pro|enterprise) → arahkan ke halaman upgrade.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: "Password tidak cocok" });
      return;
    }

    try {
      await register(form);
      if (plan === "pro" || plan === "enterprise") {
        window.location.href = `/upgrade?plan=${plan}&cycle=monthly`;
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setErrors({ _global: getErrorMessage(err) });
    }
  };

  const planLabel = { free: "Free Trial", pro: "Pro", enterprise: "Enterprise" }[plan] ?? "Free";

  // ── Render: form registrasi + indikator tenant ──
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <LogoMark size={48} />
          <span className="font-black text-3xl font-grotesk">KasirAI</span>
        </div>

        <div className="bg-white border-3 border-brand-black p-8 rounded-md" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
          <h1 className="font-black text-2xl font-grotesk mb-1">Daftar Akun</h1>
          <div className="flex items-center gap-2 mb-6">
            <p className="text-sm text-brand-black/50 font-medium">Paket dipilih:</p>
            <span className={`text-xs font-black px-2 py-0.5 border-2 border-brand-black rounded ${plan === "pro" ? "bg-brand-yellow" : "bg-white"}`}
              style={{ boxShadow: "1px 1px 0 #0A0A0A" }}>
              {planLabel}
            </span>
          </div>

          {errors._global && (
            <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border-2 border-red-400 text-red-700 text-sm font-semibold">
              {errors._global}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field name="name"  label="Nama Lengkap"  placeholder="Budi Santoso"  value={form.name}  onChange={handleChange} error={errors.name} />

            {/* Store name dengan real-time tenant check */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold">Nama Toko</label>
              <input
                name="store_name"
                type="text"
                value={form.store_name}
                onChange={handleChange}
                placeholder="Maung Store, Warung Berkah, ..."
                className={`w-full px-3 py-2.5 text-sm border-2 outline-none transition-colors rounded-md
                  ${errors.store_name ? "border-red-500"
                    : tenantStatus === "join" ? "border-blue-400"
                    : tenantStatus === "new"  ? "border-green-400"
                    : "border-brand-black focus:border-brand-yellow"}`}
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              />
              {errors.store_name && <p className="text-xs text-red-500 font-semibold">{errors.store_name}</p>}
              <TenantStatus status={tenantStatus} tenantInfo={tenantInfo} />
              {!tenantStatus && (
                <p className="text-[11px] text-brand-black/35 font-mono mt-0.5">
                  Nama toko sama = bergabung ke toko yang ada · Nama baru = buat toko sendiri
                </p>
              )}
            </div>

            <Field name="email" label="Email" type="email" placeholder="budi@email.com" value={form.email} onChange={handleChange} error={errors.email} />
            <Field name="phone" label="No. HP" placeholder="08xxxxxxxxxx" value={form.phone} onChange={handleChange} error={errors.phone} required={false} />
            <Field name="password" label="Password" type="password" placeholder="min. 8 karakter" value={form.password} onChange={handleChange} error={errors.password} />
            <Field name="password_confirmation" label="Konfirmasi Password" type="password" placeholder="ulangi password" value={form.password_confirmation} onChange={handleChange} error={errors.password_confirmation} />

            <button
              type="submit" disabled={isLoading || tenantStatus === "checking"}
              className="w-full py-3 bg-brand-yellow border-2 border-brand-black font-black text-base disabled:opacity-50 hover:bg-yellow-300 transition-colors rounded-md"
              style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
            >
              {isLoading ? "Mendaftar..." : tenantStatus === "join" ? "Bergabung ke Toko →" : "Buat Toko & Daftar →"}
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

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
