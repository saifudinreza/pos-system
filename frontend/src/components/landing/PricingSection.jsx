"use client";

// ============================================================
// PricingSection — Daftar paket harga KasirAI
//
// Analogi: Ini seperti menu paket di restoran cepat saji —
// ada yang murah (paket reguler), ada yang recommended (paket spesial),
// ada yang premium (paket family). Harga jelas, isi jelas.
//
// Tujuan: Menghilangkan rasa takut soal biaya sebelum daftar.
// Calon pelanggan bisa pilih sesuai kebutuhan bisnis.
//
// Relasi: Berdiri sendiri. Menggunakan state `billing` untuk
// toggle antara harga bulanan vs tahunan.
// ============================================================

import { useState } from "react";
import Link from "next/link";

// Data paket harga — tiap objek = satu paket
const PLANS = [
  {
    name:        "Free",
    price:       { monthly: 0, yearly: 0 },
    description: "Pas untuk toko kecil & warung yang baru mulai digital.",
    highlighted: false,
    features:    [
      "1 outlet / toko",
      "Maks. 3 kategori produk",
      "Maks. 5 produk",
      "Maks. 10 transaksi/bulan",
      "Kasir & manajemen pesanan",
      "Laporan harian & bulanan",
    ],
    missing:     ["AI Assistant", "Laporan kustom & export", "Transaksi tak terbatas"],
    cta:         "Mulai Gratis",
    ctaHref:     "/register?plan=free",
  },
  {
    name:        "Pro",
    price:       { monthly: 250000, yearly: 200000 },
    description: "Untuk bisnis berkembang yang butuh fitur lengkap.",
    highlighted: true,
    features:    [
      "Hingga 5 outlet",
      "Maks. 10 kategori produk",
      "Maks. 30 produk",
      "Transaksi tak terbatas",
      "Laporan kustom & export (PDF/Excel)",
      "AI Assistant tak terbatas",
      "Integrasi QRIS & e-wallet",
      "Support via WhatsApp & email",
    ],
    missing:     [],
    cta:         "Upgrade ke Pro",
    ctaHref:     "/register?plan=pro",
  },
  {
    name:        "Enterprise",
    price:       { monthly: 799000, yearly: 649000 },
    description: "Solusi lengkap untuk chain restoran, minimarket, atau franchise.",
    highlighted: false,
    features:    [
      "Outlet tidak terbatas",
      "Kategori & produk tidak terbatas",
      "Transaksi tidak terbatas",
      "API & integrasi kustom",
      "Dedicated account manager",
      "SLA & uptime guarantee",
      "Training tim on-site",
      "Laporan & dashboard kustom",
    ],
    missing:     [],
    cta:         "Upgrade ke Enterprise",
    ctaHref:     "/register?plan=enterprise",
  },
];

// Helper: format angka ke format Rupiah
// Analogi: seperti mesin kasir yang otomatis tambah "Rp" dan titik pemisah ribuan
const formatRupiah = (num) =>
  "Rp " + num.toLocaleString("id-ID");

// --- PricingCard: satu kartu paket harga ---
const PricingCard = ({ plan, billing }) => {
  const price = billing === "monthly" ? plan.price.monthly : plan.price.yearly;
  const isFree = price === 0 && plan.price.monthly === 0;

  return (
    <div
      className={`relative flex flex-col h-full border-3 border-brand-black p-6 transition-all duration-150
        ${plan.highlighted
          ? "bg-brand-yellow"
          : "bg-white hover:-translate-y-1 hover:-translate-x-1"
        }
      `}
      style={{
        boxShadow: plan.highlighted
          ? "6px 6px 0 #0A0A0A"
          : "4px 4px 0 #0A0A0A",
      }}
    >
      {/* Badge "Paling Populer" — hanya di plan yang highlighted */}
      {plan.highlighted && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-black text-white px-4 py-1 text-xs font-black font-mono whitespace-nowrap"
          style={{ boxShadow: "2px 2px 0 #FFE500" }}
        >
          ✦ PALING POPULER
        </div>
      )}

      {/* Nama & deskripsi paket */}
      <div className="mb-6">
        <h3 className="text-xl font-black text-brand-black font-grotesk">{plan.name}</h3>
        <p className="text-sm text-brand-black/60 font-medium mt-1">{plan.description}</p>
      </div>

      {/* Harga — angka besar yang langsung terlihat */}
      <div className="mb-6">
        {price === null ? (
          <span className="text-3xl font-black text-brand-black font-mono">
            Harga Kustom
          </span>
        ) : isFree ? (
          <>
            <span className="text-4xl font-black text-brand-black font-mono">GRATIS</span>
            <div className="mt-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 inline-block border border-green-300">
              Selamanya, tanpa kartu kredit
            </div>
          </>
        ) : (
          <>
            <span className="text-4xl font-black text-brand-black font-mono">
              {formatRupiah(price)}
            </span>
            <span className="text-sm font-semibold text-brand-black/60">/bulan</span>
            {billing === "yearly" && (
              <div className="mt-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 inline-block">
                Hemat {formatRupiah(plan.price.monthly - price)}/bln
              </div>
            )}
          </>
        )}
      </div>

      {/* Tombol CTA plan ini */}
      <Link
        href={plan.ctaHref}
        className={`block text-center py-3 font-bold border-2 border-brand-black mb-6 transition-all
          ${plan.highlighted
            ? "bg-brand-black text-white hover:bg-brand-black/90"
            : "bg-brand-yellow hover:bg-brand-yellow/90"
          }
        `}
        style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
      >
        {plan.cta} →
      </Link>

      {/* Daftar fitur tersedia */}
      <ul className="space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm font-medium text-brand-black">
            <span className="shrink-0 font-black text-green-600">✓</span> {f}
          </li>
        ))}
        {/* Fitur yang tidak tersedia */}
        {plan.missing.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm font-medium text-brand-black/30 line-through">
            <span className="shrink-0">✗</span> {f}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function PricingSection() {
  // State toggle bulanan vs tahunan
  // Analogi: seperti tombol pilih ukuran di toko — S, M, L
  const [billing, setBilling] = useState("monthly");

  return (
    <section id="harga" className="py-20 px-4 sm:px-6 bg-brand-gray">
      <div className="max-w-6xl mx-auto">

        {/* === HEADER === */}
        <div className="text-center mb-12">
          <div
            className="inline-block bg-brand-yellow border-2 border-brand-black px-3 py-1 text-xs font-mono font-black tracking-wider mb-4"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            ✦ HARGA
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-brand-black tracking-tight font-grotesk mb-4">
            Pilih paket yang pas
            <br />
            untuk bisnis Anda
          </h2>
          <p className="text-brand-black/60 font-medium max-w-md mx-auto">
            Semua paket termasuk free trial 14 hari. Tidak perlu kartu kredit.
          </p>

          {/* Toggle bulanan / tahunan
              Analogi: seperti tombol pilih ukuran baju — pilih salah satu */}
          <div
            className="inline-flex mt-6 border-2 border-brand-black overflow-hidden"
            style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
          >
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 text-sm font-bold transition-colors ${
                billing === "monthly"
                  ? "bg-brand-black text-white"
                  : "bg-white text-brand-black hover:bg-brand-yellow/30"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 text-sm font-bold transition-colors flex items-center gap-2 ${
                billing === "yearly"
                  ? "bg-brand-black text-white"
                  : "bg-white text-brand-black hover:bg-brand-yellow/30"
              }`}
            >
              Tahunan
              {/* Badge hemat — insentif memilih tahunan */}
              <span className="bg-green-400 text-green-900 text-[10px] font-black px-1.5 py-0.5 border border-green-600">
                -25%
              </span>
            </button>
          </div>
        </div>

        {/* === GRID PAKET HARGA === */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} billing={billing} />
          ))}
        </div>

        {/* Catatan garansi di bawah — mengurangi kekhawatiran */}
        <div className="text-center mt-10 text-sm text-brand-black/50 font-medium">
          Semua paket termasuk ✓ 14 hari free trial &nbsp;·&nbsp; ✓ Batalkan kapan saja &nbsp;·&nbsp; ✓ Tanpa biaya tersembunyi
        </div>
      </div>
    </section>
  );
}
