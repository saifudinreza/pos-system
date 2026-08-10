"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle, Mail, Shield, CreditCard,
  ArrowUpCircle, CheckCircle2, Calendar, Zap, Store, KeyRound, Clock, XCircle,
} from "lucide-react";
import useAuthStore from "@/stores/authStore";
import subscriptionService from "@/services/subscriptionService";
import { PLANS } from "@/stores/subscriptionStore";
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
    "Maks. 15 kategori produk",
    "Maks. 50 produk",
    "Transaksi tanpa batas",
    "5 prompt AI Assistant /bulan",
    "Pembayaran tunai",
  ],
  pro: [
    "Hingga 5 outlet",
    "Produk & kategori tidak terbatas",
    "Transaksi tak terbatas",
    "Laporan kustom & export (PDF/Excel)",
    "AI Assistant 10× prompt/hari",
    "Integrasi QRIS & e-wallet",
  ],
  enterprise: [
    "Outlet tidak terbatas",
    "Kategori & produk tidak terbatas",
    "AI Assistant 50× prompt/hari",
    "API & integrasi kustom",
    "Dedicated account manager",
    "SLA & uptime guarantee",
  ],
};

export default function ProfilePage() {
  const router  = useRouter();
  const { user, setUser, fetchCurrentUser } = useAuthStore();

  const [sub,       setSub]       = useState(null);
  const [pending,   setPending]   = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [form,      setForm]      = useState({ name: "", phone: "", store_name: "", store_description: "", midtrans_server_key: "", midtrans_client_key: "", midtrans_is_production: true });
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
        name:                 user.name ?? "",
        phone:                user.phone ?? "",
        store_name:           user.tenant_name ?? "",
        store_description:    user.tenant_description ?? "",
        midtrans_server_key:  "",
        midtrans_client_key:  user.midtrans_client_key ?? "",
        midtrans_is_production: user.midtrans_is_production ?? true,
      });
    }
  }, [user]);

  const loadSubscriptionStatus = () => {
    subscriptionService.getStatus()
      .then((d) => { setSub(d.subscription); setPending(d.pending); })
      .catch(() => {});
  };

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const handleCancelPending = async () => {
    if (!confirm("Batalkan transaksi pembayaran ini?")) return;
    setCancelling(true);
    try {
      await subscriptionService.cancelPending();
      setPending(null);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    setSuccess(false);
    try {
      const res = await subscriptionService.updateProfile(form);
      setUser(res.data);
      await fetchCurrentUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const plan        = user?.effective_plan ?? user?.subscription_plan ?? "free";
  const role        = user?.role ?? "kasir";
  const features    = PLAN_FEATURES[plan] ?? PLAN_FEATURES.free;
  const hasActiveSub = plan !== "free" || (sub && sub.expires_at);
  const canEditStore = role === "admin" || role === "developer";

  return (
    <div className="space-y-6 page-fade">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black font-grotesk">Profil & Langganan</h2>
        <p className="text-sm text-brand-black/50">Kelola informasi akun dan paket langganan kamu.</p>
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
                  placeholder="Nama toko kamu" />

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase tracking-wider text-brand-black/60">
                    Deskripsi Toko
                  </label>
                  <textarea
                    id="p-store-desc"
                    value={form.store_description}
                    onChange={(e) => setForm((p) => ({ ...p, store_description: e.target.value }))}
                    placeholder="Ceritakan sedikit tentang toko kamu..."
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

            {/* ── Midtrans Keys (admin/developer only) ── */}
            {canEditStore && (
              <div className="pt-3 border-t-2 border-brand-black/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound size={14} className="text-brand-black/50" />
                    <p className="text-xs font-black uppercase tracking-wider text-brand-black/50">Midtrans Payment</p>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 border-2 ${user?.midtrans_configured ? "bg-green-100 border-green-400 text-green-700" : "bg-red-50 border-red-300 text-red-600"}`}>
                    {user?.midtrans_configured ? "✓ Terkonfigurasi" : "Belum Dikonfigurasi"}
                  </span>
                </div>

                <p className="text-xs text-brand-black/50">
                  Dapatkan key dari <span className="font-bold">dashboard.midtrans.com</span> → Settings → Access Keys. Server Key bersifat rahasia, tidak akan ditampilkan kembali setelah disimpan.
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase tracking-wider text-brand-black/60">
                    Server Key <span className="normal-case font-normal text-brand-black/40">(Rahasia — isi hanya jika ingin mengubah)</span>
                  </label>
                  <input
                    type="password"
                    value={form.midtrans_server_key}
                    onChange={(e) => setForm((p) => ({ ...p, midtrans_server_key: e.target.value }))}
                    placeholder={user?.midtrans_configured ? "••••••••••••••••• (sudah tersimpan)" : "Mid-server-..."}
                    className="w-full px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow font-mono placeholder:text-brand-black/25"
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                    autoComplete="off"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase tracking-wider text-brand-black/60">
                    Client Key <span className="normal-case font-normal text-brand-black/40">(Public)</span>
                  </label>
                  <input
                    type="text"
                    value={form.midtrans_client_key}
                    onChange={(e) => setForm((p) => ({ ...p, midtrans_client_key: e.target.value }))}
                    placeholder="Mid-client-..."
                    className="w-full px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow font-mono placeholder:text-brand-black/25"
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                    autoComplete="off"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-brand-black/60">Mode Production</p>
                    <p className="text-[11px] text-brand-black/40">
                      Matikan untuk pakai key sandbox (testing) sebelum serius pakai uang asli.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.midtrans_is_production}
                    onClick={() => setForm((p) => ({ ...p, midtrans_is_production: !p.midtrans_is_production }))}
                    className={`shrink-0 w-14 h-8 border-2 border-brand-black transition-colors relative outline-none flex items-center ${form.midtrans_is_production ? "bg-brand-yellow" : "bg-brand-gray"}`}
                    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  >
                    <span
                      className={`block w-5 h-5 bg-white border-2 border-brand-black transition-transform duration-200 ease-in-out ${form.midtrans_is_production ? "translate-x-7" : "translate-x-1.5"}`}
                    />
                  </button>
                </div>
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
              {hasActiveSub ? "Status Langganan" : pending ? "Menunggu Pembayaran" : "Paket Langganan"}
            </h3>
          </div>

          {!hasActiveSub && pending ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-brand-black bg-brand-yellow font-black text-sm"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                <Clock size={14} />
                KasirAI {PLAN_LABELS[pending.plan] ?? pending.plan}
              </div>

              <div className="p-4 bg-yellow-50 border-2 border-yellow-400 space-y-2">
                <p className="flex items-center gap-2 text-yellow-800 font-black text-sm">
                  <Clock size={15} /> Menunggu Pembayaran
                </p>
                <p className="text-xs text-brand-black/60">
                  Selesaikan pembayaran sesuai instruksi Midtrans, atau batalkan kalau tidak jadi lanjut.
                </p>
              </div>

              <NeoButton
                variant="danger"
                size="sm"
                className="w-full"
                disabled={cancelling}
                onClick={handleCancelPending}
              >
                <XCircle size={13} /> {cancelling ? "Membatalkan..." : "Batalkan Transaksi"}
              </NeoButton>
            </div>
          ) : hasActiveSub ? (
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
                  <span className="font-black text-sm">Pro — Rp{PLANS.pro.price.toLocaleString("id-ID")}/bln</span>
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
                <span className="font-black text-sm">Enterprise — Rp{PLANS.enterprise.price.toLocaleString("id-ID")}/bln</span>
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
