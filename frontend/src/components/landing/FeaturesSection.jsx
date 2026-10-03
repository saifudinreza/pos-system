"use client";

// ============================================================
// FeaturesSection, "Solusi": fitur yang menjawab ProblemSection
//
// Hierarki (audit desain, issue #10): tiga fitur UTAMA tampil besar
// (Kasir + struk WhatsApp, Laporan laba, AI Assistant), tiga fitur
// PENDUKUNG tampil ringkas di bawahnya. AI sengaja dibuat hitam sebagai
// pembeda. Semua klaim sesuai fitur yang benar-benar ada di aplikasi.
// ============================================================

import {
  MonitorCheck,
  BrainCircuit,
  BarChart3,
  Package,
  Wallet,
  Clock4,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem, Parallax } from "./motion";

// Fitur utama, tampil besar
const MAIN_FEATURES = [
  {
    Icon: MonitorCheck,
    title: "Kasir cepat, struk langsung ke WhatsApp",
    description:
      "Pilih produk, keranjang menghitung total dan PPN otomatis. Begitu lunas, struk digital terkirim ke WhatsApp pelanggan.",
  },
  {
    Icon: BarChart3,
    title: "Laporan laba tanpa rekap manual",
    description:
      "Penjualan, laba kotor, margin, dan stok dihitung otomatis dari transaksi. Unduh PDF atau Excel dengan paket Pro.",
  },
  {
    Icon: BrainCircuit,
    title: "AI Assistant yang paham tokomu",
    description:
      "Tanya \"produk apa yang paling laku?\" atau \"stok mana yang perlu di-restock?\" dan dapat jawaban dari data tokomu sendiri.",
    dark: true,
  },
];

// Fitur pendukung, tampil ringkas
const SUPPORT_FEATURES = [
  {
    Icon: Package,
    title: "Stok real-time",
    description: "Stok berkurang tiap transaksi. Produk menipis dan habis langsung terlihat, lengkap dengan riwayat pergerakan stok.",
  },
  {
    Icon: Wallet,
    title: "Banyak cara bayar",
    description: "Tunai, atau QRIS, e-wallet, transfer bank (Virtual Account), dan kartu kredit lewat Midtrans dengan paket Pro.",
  },
  {
    Icon: Clock4,
    title: "Shift & kas harian",
    description: "Buka dan tutup shift, hitung uang fisik per pecahan, dan selisih kas terhitung otomatis.",
  },
];

/** Kartu fitur utama (besar). `dark` = versi hitam untuk AI. */
const MainCard = ({ Icon, title, description, dark }) => (
  <div
    className={`h-full border-3 border-brand-black p-7 flex flex-col gap-4 transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 ${
      dark ? "bg-brand-black text-white" : "bg-white text-brand-black"
    }`}
    style={{ boxShadow: dark ? "6px 6px 0 #FFE500" : "6px 6px 0 #0A0A0A" }}
  >
    <div
      className="w-14 h-14 bg-brand-yellow border-2 border-brand-black flex items-center justify-center"
      style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
    >
      <Icon size={26} className="text-brand-black" strokeWidth={2.5} />
    </div>
    <h3 className="font-black text-2xl leading-tight font-grotesk">{title}</h3>
    <p className={`font-medium leading-relaxed ${dark ? "text-white/75" : "text-brand-black/65"}`}>{description}</p>
  </div>
);

/** Kartu fitur pendukung (ringkas, ikon di kiri). */
const SupportCard = ({ Icon, title, description }) => (
  <div
    className="h-full bg-white border-2 border-brand-black p-5 flex gap-4"
    style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
  >
    <div className="shrink-0 w-10 h-10 bg-brand-gray border-2 border-brand-black flex items-center justify-center">
      <Icon size={20} className="text-brand-black" strokeWidth={2.5} />
    </div>
    <div>
      <h3 className="font-black text-base leading-tight font-grotesk mb-1">{title}</h3>
      <p className="text-sm text-brand-black/65 font-medium leading-relaxed">{description}</p>
    </div>
  </div>
);

/**
 * FeaturesSection, tiga fitur utama + tiga fitur pendukung (stagger saat scroll).
 * Tanpa props; konten dari konstanta di atas.
 */
export default function FeaturesSection() {
  return (
    <section id="fitur" className="relative z-[1] py-20 px-4 sm:px-6 overflow-hidden scroll-mt-28">
      <Parallax speed={-0.45} aria-hidden="true" className="pointer-events-none absolute right-4 top-20 -z-0">
        <div className="w-24 h-24 bg-brand-yellow/30 border-3 border-brand-black/20 rotate-6" />
      </Parallax>
      <Parallax speed={0.4} aria-hidden="true" className="pointer-events-none absolute -left-8 bottom-24 -z-0">
        <div className="w-16 h-16 rounded-full bg-[#0066FF]/15 border-3 border-[#0066FF]/30" />
      </Parallax>

      <div className="relative max-w-6xl mx-auto">
        <Reveal className="mb-12">
          <div
            className="inline-block bg-brand-black text-white px-3 py-1 text-xs font-mono font-black tracking-wider mb-4"
            style={{ boxShadow: "2px 2px 0 #FFE500" }}
          >
            SOLUSINYA
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-brand-black tracking-tight font-grotesk max-w-xl">
            Semua yang kamu
            <br />
            butuhkan,{" "}
            <span className="bg-brand-yellow px-1">satu platform.</span>
          </h2>
          <p className="mt-4 text-brand-black/65 font-medium max-w-lg">
            Dari kasir hingga laporan, dari stok hingga AI, semuanya terhubung dan bekerja otomatis untuk tokomu.
          </p>
        </Reveal>

        <Stagger className="grid md:grid-cols-3 gap-6" gap={0.08}>
          {MAIN_FEATURES.map((f) => (
            <StaggerItem key={f.title} className="h-full">
              <MainCard {...f} />
            </StaggerItem>
          ))}
        </Stagger>

        <Stagger className="grid md:grid-cols-3 gap-5 mt-8" gap={0.06}>
          {SUPPORT_FEATURES.map((f) => (
            <StaggerItem key={f.title} className="h-full">
              <SupportCard {...f} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
