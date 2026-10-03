"use client";

// ============================================================
// PricingSection, Daftar paket harga KasirAI
//
// Analogi: Ini seperti menu paket di restoran cepat saji,
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
import { Reveal, Stagger, StaggerItem, Parallax } from "./motion";
import { trackEvent } from "@/lib/analytics";

// Data paket harga, tiap objek = satu paket
// Harga harus sinkron dengan backend (SubscriptionController::PRICES)
const PLANS = [
  {
    name:        "Free",
    price:       { monthly: 0, yearly: 0 },
    description: "Gratis selamanya, bisa langsung dipakai toko kecil & warung untuk operasional harian.",
    highlighted: false,
    features:    [
      "Maks. 50 produk",
      "Transaksi tak terbatas",
      "Kasir & manajemen pesanan",
      "Shift & rekonsiliasi kas",
      "Laporan harian & bulanan",
      "5 prompt AI/bulan",
    ],
    missing:     ["Pembayaran QRIS/digital", "Export laporan PDF/Excel", "Kuota AI harian"],
    cta:         "Mulai Gratis",
    ctaHref:     "/register?plan=free",
  },
  {
    name:        "Pro",
    price:       { monthly: 129000, yearly: 1290000 },
    description: "Untuk bisnis berkembang yang butuh pembayaran digital & laporan lengkap.",
    highlighted: true,
    features:    [
      "Produk & kategori tidak terbatas",
      "Transaksi tak terbatas",
      "Laporan lengkap & export (PDF/Excel)",
      "AI Assistant 10× prompt/hari",
      "Pembayaran QRIS, e-wallet & transfer bank",
      "Support via WhatsApp & email",
    ],
    missing:     [],
    cta:         "Upgrade ke Pro",
    ctaHref:     "/register?plan=pro",
  },
  {
    name:        "Enterprise",
    price:       { monthly: 499000, yearly: 4990000 },
    description: "Solusi lengkap untuk chain restoran, minimarket, atau franchise.",
    highlighted: false,
    features:    [
      "Semua fitur Paket Pro",
      "AI Assistant 50× prompt/hari",
      "Pengguna tidak terbatas",
      "Laporan & dashboard lintas cabang",
      "Akses API & integrasi kustom",
      "Prioritas support & pendampingan",
      "Training tim on-site",
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

// Tabel perbandingan singkat. SINKRONKAN dengan batas di backend
// (Controller::productReadLimits/categoryReadLimits, config/ai.php) dan PLANS di atas.
const COMPARE_ROWS = [
  { label: "Produk", free: "Hingga 50", pro: "Tak terbatas", ent: "Tak terbatas" },
  { label: "Kategori", free: "Hingga 15", pro: "Tak terbatas", ent: "Tak terbatas" },
  { label: "Pembayaran", free: "Tunai", pro: "Tunai, QRIS, e-wallet, VA, kartu", ent: "Tunai, QRIS, e-wallet, VA, kartu" },
  { label: "Unduh laporan PDF/Excel", free: "Tidak", pro: "Ya", ent: "Ya" },
  { label: "Pertanyaan AI", free: "5 per bulan", pro: "10 per hari", ent: "50 per hari" },
];

/** ComparisonTable, perbandingan Free vs Pro vs Enterprise (bisa digeser di layar kecil). */
function ComparisonTable() {
  return (
    <div className="mt-14">
      <h3 className="text-center font-grotesk font-black text-2xl text-brand-black mb-5">Bandingkan paket</h3>
      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[640px] bg-white border-3 border-brand-black text-sm"
          style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
        >
          <thead>
            <tr className="bg-brand-black text-white text-left">
              <th scope="col" className="p-3 font-bold">Fitur</th>
              <th scope="col" className="p-3 font-bold">Free</th>
              <th scope="col" className="p-3 font-bold bg-brand-yellow text-brand-black">Pro</th>
              <th scope="col" className="p-3 font-bold">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((r) => (
              <tr key={r.label} className="border-t-2 border-brand-black/15">
                <th scope="row" className="p-3 text-left font-bold">{r.label}</th>
                <td className="p-3 font-medium">{r.free}</td>
                <td className="p-3 font-bold bg-brand-yellow/30">{r.pro}</td>
                <td className="p-3 font-medium">{r.ent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * PricingCard, satu kartu paket harga (lihat header file).
 *
 * Props:
 *   plan   : objek dari PLANS (name, price {monthly, yearly}, features, ...)
 *   billing: "monthly" | "yearly", menentukan harga yang ditampilkan
 */
// --- PricingCard: satu kartu paket harga ---
const PricingCard = ({ plan, billing }) => {
  // Harga aktif mengikuti toggle billing (bulanan vs tahunan)
  const price = billing === "monthly" ? plan.price.monthly : plan.price.yearly;
  // Paket GRATIS = harga 0 di bulanan (independen dari toggle billing)
  const isFree = price === 0 && plan.price.monthly === 0;

  return (
    <div
      className={`relative flex flex-col h-full border-3 border-brand-black p-6 transition-all duration-150 rounded-md
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
      {/* Badge "Paling Populer", hanya di plan yang highlighted */}
      {plan.highlighted && (
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-black text-white px-4 py-1 text-xs font-black font-mono whitespace-nowrap"
          style={{ boxShadow: "2px 2px 0 #FFE500" }}
        >
           PALING POPULER
        </div>
      )}

      {/* Nama & deskripsi paket */}
      <div className="mb-6">
        <h3 className="text-xl font-black text-brand-black font-grotesk">{plan.name}</h3>
        <p className="text-sm text-brand-black/60 font-medium mt-1">{plan.description}</p>
      </div>

      {/* Harga, angka besar yang langsung terlihat */}
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
            <span className="text-sm font-semibold text-brand-black/60">
              {billing === "yearly" ? "/tahun" : "/bulan"}
            </span>
            {/* Tahunan = ditagih sekali setahun. Tampilkan setara per bulan dan
                nilai hemat (monthly × 12 − yearly) dibanding membayar bulanan */}
            {billing === "yearly" && (
              <div className="mt-1 text-xs font-bold text-green-800 bg-green-100 border border-green-300 px-2 py-0.5 inline-block">
                Setara {formatRupiah(Math.round(plan.price.yearly / 12))}/bulan · hemat{" "}
                {formatRupiah(plan.price.monthly * 12 - plan.price.yearly)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tombol CTA plan ini */}
      {/* Hanya paket sorotan (Pro) yang hitam = tombol utama; sisanya putih */}
      <Link
        href={plan.ctaHref}
        onClick={() => trackEvent("cta_click", { posisi: "pricing", paket: plan.name.toLowerCase() })}
        className={`block text-center py-3 font-bold border-2 border-brand-black mb-6 transition-all focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-brand-black
          ${plan.highlighted
            ? "bg-brand-black text-white hover:bg-brand-black/90"
            : "bg-white hover:bg-brand-yellow/50"
          }
        `}
        style={{ boxShadow: plan.highlighted ? "3px 3px 0 #FFFBEB" : "2px 2px 0 #0A0A0A" }}
      >
        {plan.cta} →
      </Link>

      {/* Daftar fitur tersedia */}
      <ul className="space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm font-medium text-brand-black">
            <span aria-hidden="true" className="shrink-0 font-black text-green-700">✓</span> {f}
          </li>
        ))}
        {/* Fitur yang tidak tersedia */}
        {plan.missing.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm font-medium text-brand-black/50 line-through">
            <span aria-hidden="true" className="shrink-0 no-underline">✕</span> {f}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * PricingSection, daftar paket harga dengan toggle bulanan/tahunan
 * (lihat header file). State internal: `billing`.
 */
export default function PricingSection() {
  // State toggle bulanan vs tahunan
  // Analogi: seperti tombol pilih ukuran di toko, S, M, L
  const [billing, setBilling] = useState("monthly");

  return (
    <section id="harga" className="relative z-[1] py-20 px-4 sm:px-6 bg-brand-gray overflow-hidden scroll-mt-28">
      {/* Shape parallax dekoratif */}
      <Parallax speed={-0.45} aria-hidden="true" className="pointer-events-none absolute left-4 top-24 -z-0">
        <div className="w-20 h-20 bg-brand-yellow/25 border-3 border-brand-black/15 rotate-6" />
      </Parallax>
      <Parallax speed={0.4} aria-hidden="true" className="pointer-events-none absolute right-6 bottom-20 -z-0">
        <div className="w-16 h-16 rounded-full bg-[#8B5CF6]/15 border-3 border-[#8B5CF6]/30" />
      </Parallax>

      <div className="relative max-w-6xl mx-auto rounded-md">

        {/* === HEADER === */}
        <Reveal className="text-center mb-12">
          <div
            className="inline-block bg-brand-yellow border-2 border-brand-black px-3 py-1 text-xs font-mono font-black tracking-wider mb-4 rounded-md"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
             HARGA
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-brand-black tracking-tight font-grotesk mb-4">
            Pilih paket yang pas
            <br />
            untuk bisnis kamu
          </h2>
          <p className="text-brand-black/60 font-medium max-w-md mx-auto">
            Mulai dari paket Free tanpa kartu kredit. Upgrade ke Pro kapan saja.
          </p>

          {/* Toggle bulanan / tahunan
              Analogi: seperti tombol pilih ukuran baju, pilih salah satu */}
          <div
            className="inline-flex mt-6 border-2 border-brand-black overflow-hidden rounded-md"
            style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
          >
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 text-sm font-bold transition-colors ${
                billing === "monthly"
                  ? "bg-brand-black text-white rounded-md"
                  : "bg-white text-brand-black hover:bg-brand-yellow/30 rounded-md"
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
              {/* Badge hemat, insentif memilih tahunan */}
              <span className="bg-green-400 text-green-900 text-[10px] font-black px-1.5 py-0.5 border border-green-600">
                Hemat 2 bulan
              </span>
            </button>
          </div>
        </Reveal>

        {/* === GRID PAKET HARGA === */}
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch rounded-md" gap={0.1}>
          {PLANS.map((plan) => (
            <StaggerItem key={plan.name} className="h-full">
              <PricingCard plan={plan} billing={billing} />
            </StaggerItem>
          ))}
        </Stagger>

        <ComparisonTable />

        {/* Catatan di bawah tabel */}
        <div className="text-center mt-10 text-sm text-brand-black/50 font-medium">
          Paket Free gratis selamanya &nbsp;·&nbsp; Upgrade kapan saja &nbsp;·&nbsp; Pembayaran langganan lewat Midtrans
        </div>
      </div>
    </section>
  );
}
