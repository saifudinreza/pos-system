"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, User, CheckCircle2, ArrowLeft } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import subscriptionService from "@/services/subscriptionService";
import NeoButton from "@/components/ui/NeoButton";
import NeoInput  from "@/components/ui/NeoInput";
import { getErrorMessage, formatCurrency } from "@/lib/utils";

const SNAP_URL    = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL    ?? "https://app.midtrans.com/snap/snap.js";
const CLIENT_KEY  = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY  ?? "";

/** Load Midtrans Snap script on-demand. Resolves when window.snap is ready. */
function loadSnap() {
  return new Promise((resolve, reject) => {
    if (window.snap) { resolve(); return; }
    const existing = document.querySelector(`script[src="${SNAP_URL}"]`);
    if (existing) {
      // Script tag exists but snap might not be ready yet — poll briefly
      let tries = 0;
      const wait = setInterval(() => {
        if (window.snap) { clearInterval(wait); resolve(); }
        if (++tries > 40) { clearInterval(wait); reject(new Error("Snap timeout")); }
      }, 150);
      return;
    }
    const s = document.createElement("script");
    s.src = SNAP_URL;
    s.setAttribute("data-client-key", CLIENT_KEY);
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat Midtrans. Periksa koneksi internet."));
    document.head.appendChild(s);
  });
}

// Harga harus sinkron dengan backend (SubscriptionController::PRICES)
const PRICES = {
  pro:        { monthly: 129000, yearly: 100000 },
  enterprise: { monthly: 499000, yearly: 399000 },
};

const PLAN_LABELS = { pro: "Pro", enterprise: "Enterprise" };

const PLAN_FEATURES = {
  pro: [
    "Produk & kategori tidak terbatas",
    "Transaksi tak terbatas",
    "AI Assistant tak terbatas",
    "Laporan lengkap & export (PDF/Excel)",
    "Pembayaran QRIS, e-wallet & transfer bank (Midtrans)",
    "Support via WhatsApp & email",
  ],
  enterprise: [
    "Semua fitur Paket Pro",
    "Pengguna tidak terbatas",
    "Prioritas support & pendampingan",
    "Manajemen & laporan lintas cabang",
    "Akses API & integrasi kustom",
  ],
};

function UpgradeContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user }     = useAuthStore();

  const plan  = searchParams.get("plan") ?? "pro";
  const cycle = searchParams.get("cycle") ?? "monthly";

  const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.pro;

  const [form, setForm]     = useState({ name: "", phone: "", address: "" });
  const [billing, setBilling] = useState(cycle);
  const [paying,  setPaying]  = useState(false);
  const [snapStep, setSnapStep] = useState("idle"); // idle | loading-script | loading-token | ready
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (user) setForm((p) => ({ ...p, name: user.name ?? "", phone: user.phone ?? "" }));
  }, [user]);

  const currentPrice = PRICES[plan]?.[billing] ?? PRICES.pro.monthly;

  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    setError("");

    try {
      // 1. Dapatkan snap_token dari backend
      setSnapStep("loading-token");
      const res = await subscriptionService.initiate({
        plan,
        billing_cycle: billing,
        name:    form.name,
        phone:   form.phone,
        address: form.address,
      });

      // 2. Load Midtrans Snap script kalau belum ada
      setSnapStep("loading-script");
      await loadSnap();
      setSnapStep("ready");

      // 3. Buka popup Midtrans
      window.snap.pay(res.snap_token, {
        onSuccess: () => router.push(`/upgrade/success?plan=${plan}&cycle=${billing}&amount=${currentPrice}`),
        onPending: () => router.push(`/upgrade/pending?plan=${plan}`),
        onError:   () => router.push(`/upgrade/cancel?plan=${plan}`),
        onClose:   () => { setPaying(false); setSnapStep("idle"); },
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setPaying(false);
      setSnapStep("idle");
    }
  };

  const btnLabel = () => {
    if (!paying) return `Bayar ${formatCurrency(currentPrice)}`;
    if (snapStep === "loading-token")  return "Menyiapkan pembayaran...";
    if (snapStep === "loading-script") return "Memuat Midtrans...";
    return "Memproses...";
  };

  return (
    <>

      <div className="space-y-6 max-w-4xl page-fade">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 hover:opacity-70">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black font-grotesk">Upgrade ke {PLAN_LABELS[plan] ?? "Pro"}</h2>
            <p className="text-sm text-brand-black/50">Isi data identitas dan lanjutkan ke pembayaran.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Form identitas ── */}
          <div className="lg:col-span-3 border-2 border-brand-black bg-white p-6" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
            <div className="flex items-center gap-2 mb-5">
              <User size={18} strokeWidth={2.5} />
              <h3 className="font-black font-grotesk">Data Identitas</h3>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              {error && (
                <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border-2 border-red-300">{error}</p>
              )}

              <NeoInput label="Nama Lengkap *" id="u-name" required value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama sesuai identitas" />

              <NeoInput label="No. Telepon *" id="u-phone" required value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="08xxx" />

              <NeoInput label="Alamat (opsional)" id="u-address" value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Alamat usaha kamu" />

              {/* Toggle billing cycle */}
              <div className="pt-1">
                <p className="text-xs font-black uppercase tracking-wider text-brand-black/60 mb-2">Siklus Pembayaran</p>
                <div className="inline-flex border-2 border-brand-black overflow-hidden" style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                  <button type="button" onClick={() => setBilling("monthly")}
                    className={`px-4 py-2 text-sm font-bold transition-colors ${billing === "monthly" ? "bg-brand-black text-white" : "bg-white hover:bg-brand-yellow/30"}`}>
                    Bulanan
                  </button>
                  <button type="button" onClick={() => setBilling("yearly")}
                    className={`px-4 py-2 text-sm font-bold transition-colors flex items-center gap-1.5 ${billing === "yearly" ? "bg-brand-black text-white" : "bg-white hover:bg-brand-yellow/30"}`}>
                    Tahunan
                    <span className="text-[9px] bg-green-400 text-green-900 px-1 font-black border border-green-600">HEMAT</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <NeoButton type="submit" variant="primary" disabled={paying}>
                  <CreditCard size={14} className="inline mr-1.5" />
                  {btnLabel()}
                </NeoButton>
                <p className="text-xs text-brand-black/40 mt-2">
                  Pembayaran aman via Midtrans · QRIS, transfer bank, kartu kredit/debit
                </p>
              </div>
            </form>
          </div>

          {/* ── Ringkasan paket ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border-2 border-brand-black bg-brand-yellow p-5" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
              <p className="text-xs font-black uppercase tracking-wider mb-1">Paket Dipilih</p>
              <p className="text-2xl font-black font-grotesk">KasirAI {PLAN_LABELS[plan]}</p>
              <p className="text-3xl font-black font-mono mt-2">{formatCurrency(currentPrice)}</p>
              <p className="text-xs font-semibold text-brand-black/60">/{billing === "monthly" ? "bulan" : "tahun"}</p>
              {billing === "yearly" && (
                <p className="text-xs font-bold text-green-700 mt-1">
                  Hemat {formatCurrency((PRICES[plan].monthly * 12) - (currentPrice * 12))} vs bulanan
                </p>
              )}
            </div>

            <div className="border-2 border-brand-black bg-white p-5" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
              <p className="text-xs font-black uppercase tracking-wider mb-3">Yang Kamu Dapat</p>
              <ul className="space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-brand-black/70">
                    <CheckCircle2 size={13} className="text-green-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  );
}
