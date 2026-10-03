"use client";

// ============================================================
// UpgradeModal, tawaran upgrade tepat di momen user butuh fitur
//
// Dibuka lewat useUpgradeModalStore.show("qris" | "export" | "ai").
// Isi menyesuaikan fitur dan paket user. Harga dibaca dari PLANS
// (subscriptionStore) supaya selalu sinkron dengan backend.
// Kasir (bukan admin) tidak bisa membayar langganan, jadi diarahkan
// untuk menghubungi pemilik toko.
// ============================================================

import { useEffect } from "react";
import Link from "next/link";
import { X, Lock } from "lucide-react";
import useUpgradeModalStore from "@/stores/upgradeModalStore";
import useAuthStore from "@/stores/authStore";
import { PLANS } from "@/stores/subscriptionStore";
import { formatCurrency } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { neoButtonClass } from "@/components/ui/NeoButton";

// Isi per fitur. `target` = paket yang ditawarkan.
function getCopy(feature, plan) {
  if (feature === "qris") {
    return {
      target: "pro",
      title: "Terima QRIS dan e-wallet dengan paket Pro",
      points: [
        "QRIS, GoPay, OVO, Virtual Account, dan kartu kredit lewat Midtrans",
        "Produk dan kategori tanpa batas",
        "Unduh laporan PDF dan Excel",
      ],
    };
  }
  if (feature === "export") {
    return {
      target: "pro",
      title: "Unduh laporan PDF dan Excel dengan paket Pro",
      points: [
        "Laporan penjualan lengkap dengan laba kotor dan margin",
        "Laporan stok dalam format PDF dan Excel",
        "Plus pembayaran QRIS dan e-wallet di kasir",
      ],
    };
  }
  // feature === "ai"
  if (plan === "pro") {
    return {
      target: "enterprise",
      title: "Kuota AI hari ini sudah habis",
      points: [
        "Paket Enterprise: 50 pertanyaan AI per hari",
        "Atau coba lagi besok, kuota Pro (10 per hari) terisi ulang",
      ],
    };
  }
  return {
    target: "pro",
    title: "Kuota AI bulan ini sudah habis",
    points: [
      "Paket Pro: 10 pertanyaan AI per hari",
      "Plus QRIS dan e-wallet, serta unduh laporan PDF dan Excel",
    ],
  };
}

export default function UpgradeModal() {
  const { open, feature, close } = useUpgradeModalStore();
  const user = useAuthStore((s) => s.user);

  const plan = user?.effective_plan ?? user?.subscription_plan ?? "free";
  const isCashier = user?.role === "kasir";
  const copy = feature ? getCopy(feature, plan) : null;

  useEffect(() => {
    if (!open) return;
    trackEvent("upgrade_prompt_view", { fitur: feature, paket_saat_ini: plan });
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, feature, plan, close]);

  if (!open || !copy) return null;

  const target = PLANS[copy.target];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="w-full max-w-md bg-white border-3 border-brand-black p-6"
        style={{ boxShadow: "8px 8px 0 var(--ink)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-11 h-11 bg-brand-yellow border-2 border-brand-black flex items-center justify-center shrink-0">
            <Lock size={20} strokeWidth={2.5} />
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Tutup"
            className="p-1 hover:bg-brand-yellow/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-black"
          >
            <X size={20} />
          </button>
        </div>

        <h2 id="upgrade-modal-title" className="font-grotesk font-black text-2xl leading-tight mb-3">
          {copy.title}
        </h2>

        <ul className="space-y-2 mb-5 text-sm font-medium text-brand-black/80">
          {copy.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span aria-hidden="true" className="font-black text-green-700">✓</span>
              {p}
            </li>
          ))}
        </ul>

        <div className="bg-brand-yellow border-2 border-brand-black px-4 py-3 mb-5">
          <div className="font-grotesk font-black">{target.name}</div>
          <div className="font-mono font-bold text-xl">
            {formatCurrency(target.price)}
            <span className="text-sm font-semibold"> /bulan</span>
          </div>
        </div>

        {isCashier ? (
          <p className="text-sm font-semibold text-brand-black/70 border-2 border-dashed border-brand-black/30 p-3">
            Upgrade paket dilakukan oleh pemilik atau admin toko. Hubungi mereka untuk membuka fitur ini.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/upgrade?plan=${copy.target}`}
              onClick={() => {
                trackEvent("cta_click", { posisi: "modal_upgrade", fitur: feature, paket: copy.target });
                close();
              }}
              autoFocus
              className={neoButtonClass({ variant: "cta", size: "lg", className: "flex-1" })}
            >
              Lihat paket {target.name} →
            </Link>
            <button
              type="button"
              onClick={close}
              className={neoButtonClass({ variant: "secondary", size: "lg" })}
            >
              Nanti saja
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
