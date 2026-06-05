"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle, Mail, Shield, CreditCard,
  ArrowUpCircle, CheckCircle2, Calendar, Zap, Store,
} from "lucide-react";
import useAuthStore from "@/stores/authStore";
import subscriptionService from "@/services/subscriptionService";
import NeoButton from "@/components/ui/NeoButton";
import NeoInput  from "@/components/ui/NeoInput";
import { getErrorMessage } from "@/lib/utils";

const PLAN_LABELS = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
const PLAN_COLORS = {
  free:       "bg-white border-brand-black/30 text-brand-black/60",
  pro:        "bg-brand-yellow border-brand-black text-brand-black",
  enterprise: "bg-brand-black text-white border-brand-black",
};

const PLAN_FEATURES = {
  free: [
    "1 outlet / toko",
    "Maks. 3 kategori produk",
    "Maks. 5 produk",
    "Maks. 10 transaksi/bulan",
    "Laporan harian & bulanan",
  ],
  pro: [
    "Hingga 5 outlet",
    "Maks. 10 kategori & 30 produk",
    "Transaksi tak terbatas",
    "Laporan kustom & export (PDF/Excel)",
    "AI Assistant tak terbatas",
    "Integrasi QRIS & e-wallet",
  ],
  enterprise: [
    "Outlet tidak terbatas",
    "Kategori & produk tidak terbatas",
    "API & integrasi kustom",
    "Dedicated account manager",
    "SLA & uptime guarantee",
  ],
};

export default function ProfilePage() {
  const router  = useRouter();
  const { user, setUser, fetchCurrentUser } = useAuthStore();

  const [sub,       setSub]       = useState(null);
  const [form,      setForm]      = useState({ name: "", phone: "", store_name: "", store_description: "" });
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const [success,   setSuccess]   = useState(false);
  const [mounted,   setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCurrentUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      setForm({
        name:              user.name ?? "",
        phone:             user.phone ?? "",
        store_name:        user.tenant_name ?? "",
        store_description: user.tenant_description ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    subscriptionService.getStatus()
      .then((d) => setSub(d.subscription))
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    setSuccess(false);
    try {
      const res = await subscriptionService.updateProfile(form);
      setUser(res.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const plan        = user?.subscription_plan ?? "free";
  const role        = user?.role ?? "kasir";
  const features    = PLAN_FEATURES[plan] ?? PLAN_FEATURES.free;
  const hasActiveSub = plan !== "free" || (sub && sub.expires_at);
  const canEditStore = role === "admin" || role === "developer";

  return (
    <div className="space-y-6 page-fade">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black font-grotesk">Profil & Langganan</h2>
        <p className="text-sm text-brand-black/50">Kelola informasi akun dan paket langganan Anda.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Kiri: Form Profil ── */}
        <div className="border-2 border-brand-black bg-white p-6" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-brand-yellow border-2 border-brand-black flex items-center justify-center"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              <UserCircle size={20} strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-base font-grotesk">Informasi Akun</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border-2 border-red-300">{formError}</p>
            )}
            {success && (
              <p className="text-sm text-green-700 font-semibold bg-green-50 p-3 border-2 border-green-300 flex items-center gap-2">
                <CheckCircle2 size={14} /> Profil berhasil diperbarui!
              </p>
            )}

            {/* ── User info ── */}
            <NeoInput label="Nama Lengkap" id="p-name" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase tracking-wider text-brand-black/60">Email</label>
              <div className="flex items-center gap-2 px-3 py-2 border-2 border-brand-black/20 bg-brand-gray/50 text-sm text-brand-black/50">
                <Mail size={14} />
                <span className="font-mono truncate">{user?.email}</span>
              </div>
            </div>

            <NeoInput label="No. Telepon" id="p-phone" value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="08xxx" />

            <div className="flex items-center gap-2 text-xs text-brand-black/40 pt-1 pb-1">
              <Shield size={12} />
              <span>Role: <span className="font-bold capitalize text-brand-black">{role}</span></span>
            </div>

            {/* ── Store info (admin/developer only) ── */}
            {canEditStore && (
              <div className="pt-3 border-t-2 border-brand-black/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Store size={14} className="text-brand-black/50" />
                  <p className="text-xs font-black uppercase tracking-wider text-brand-black/50">Info Toko</p>
                </div>

                <NeoInput label="Nama Toko" id="p-store-name" value={form.store_name}
                  onChange={(e) => setForm((p) => ({ ...p, store_name: e.target.value }))}
                  placeholder="Nama toko Anda" />

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase tracking-wider text-brand-black/60">
                    Deskripsi Toko
                  </label>
                  <textarea
                    id="p-store-desc"
                    value={form.store_description}
                    onChange={(e) => setForm((p) => ({ ...p, store_description: e.target.value }))}
                    placeholder="Ceritakan sedikit tentang toko Anda..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border-2 border-brand-black outline-none resize-none focus:border-brand-yellow placeholder:text-brand-black/25"
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  />
                </div>
              </div>
            )}

            {/* Tampilkan nama toko saja untuk kasir (read-only) */}
            {!canEditStore && user?.tenant_name && (
              <div className="flex items-center gap-2 text-xs text-brand-black/40 pt-1">
                <Store size={12} />
                <span>Toko: <span className="font-bold text-brand-black">{user.tenant_name}</span></span>
              </div>
            )}

            <NeoButton type="submit" variant="primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </NeoButton>
          </form>
        </div>

        {/* ── Kanan: Status Langganan ── */}
        <div className="border-2 border-brand-black bg-white p-6" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-brand-yellow border-2 border-brand-black flex items-center justify-center"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              <CreditCard size={20} strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-base font-grotesk">
              {hasActiveSub ? "Status Langganan" : "Paket Langganan"}
            </h3>
          </div>

          {hasActiveSub ? (
            <div className="space-y-4">
              {/* Badge plan aktif */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 border-2 font-black text-sm ${PLAN_COLORS[plan] ?? PLAN_COLORS.free}`}
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                <CheckCircle2 size={14} />
                KasirAI {PLAN_LABELS[plan] ?? "Free"}
              </div>

              <div className="p-4 bg-green-50 border-2 border-green-300 space-y-2">
                <p className="flex items-center gap-2 text-green-700 font-black text-sm">
                  <CheckCircle2 size={15} /> Langganan Aktif
                </p>
                {sub?.expires_at && (
                  <p className="flex items-center gap-2 text-xs text-brand-black/60 font-mono">
                    <Calendar size={12} /> Berlaku hingga: <span className="font-bold">{sub.expires_at}</span>
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-brand-black/40 mb-2">Fitur paket kamu</p>
                <ul className="space-y-1.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-brand-black/70">
                      <CheckCircle2 size={13} className="text-green-600 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {plan === "pro" && (
                <p className="text-xs text-brand-black/40 pt-2 border-t-2 border-brand-black/10">
                  Butuh lebih? <button onClick={() => router.push("/upgrade?plan=enterprise&cycle=yearly")} className="font-black text-brand-black underline">Upgrade ke Enterprise</button>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 border-2 font-black text-sm ${PLAN_COLORS.free}`}
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                <Zap size={14} />
                Free
              </div>

              <p className="text-sm text-brand-black/60">
                Kamu sedang menggunakan paket gratis. Upgrade untuk akses fitur lengkap.
              </p>

              {/* Pro card */}
              <div className="border-2 border-brand-black p-4 space-y-3" style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">Pro — Rp250.000/bln</span>
                  <span className="text-xs font-mono bg-brand-yellow px-2 py-0.5 font-bold border border-brand-black">Populer</span>
                </div>
                <ul className="space-y-1">
                  {PLAN_FEATURES.pro.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-brand-black/60">
                      <CheckCircle2 size={11} className="text-green-600 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <NeoButton variant="primary" size="sm" className="w-full"
                  onClick={() => router.push("/upgrade?plan=pro&cycle=monthly")}>
                  <ArrowUpCircle size={13} /> Upgrade ke Pro
                </NeoButton>
              </div>

              {/* Enterprise card */}
              <div className="border-2 border-brand-black p-4 space-y-3 bg-brand-black text-white" style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                <span className="font-black text-sm">Enterprise — Rp799.000/bln</span>
                <ul className="space-y-1">
                  {PLAN_FEATURES.enterprise.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-white/60">
                      <CheckCircle2 size={11} className="text-green-400 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <NeoButton variant="secondary" size="sm" className="w-full"
                  onClick={() => router.push("/upgrade?plan=enterprise&cycle=yearly")}>
                  <ArrowUpCircle size={13} /> Upgrade ke Enterprise
                </NeoButton>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
