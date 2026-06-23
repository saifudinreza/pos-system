"use client";

// ============================================================
// ProblemSection — "Ribetnya kelola toko manual"
//
// Posisi cerita: tepat setelah Hero. Tujuannya membuat user
// mengangguk — "iya, ini masalahku" — sebelum kita tunjukkan
// solusinya di section berikutnya.
//
// Visual: kartu-kartu "rasa sakit" (pain points) yang muncul
// berurutan saat scroll. Nuansa sengaja sedikit "berantakan"
// (rotasi miring, warna alarm) untuk mewakili kekacauan manual.
// ============================================================

import {
  NotebookPen,
  PackageX,
  FileSpreadsheet,
  Clock4,
  TrendingDown,
  HelpCircle,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem, Parallax } from "./motion";

const PAINS = [
  {
    Icon: NotebookPen,
    title: "Catat penjualan manual",
    desc: "Tulis di buku atau Excel satu per satu. Salah hitung, lupa catat, dan rawan selisih kas.",
    tilt: "-1.5deg",
  },
  {
    Icon: PackageX,
    title: "Stok sering meleset",
    desc: "Baru sadar barang habis saat pelanggan sudah di depan kasir. Reorder telat, omzet hilang.",
    tilt: "1.2deg",
  },
  {
    Icon: FileSpreadsheet,
    title: "Laporan bikin pusing",
    desc: "Tutup buku tiap malam, rekap manual berjam-jam, dan tetap tidak yakin angkanya benar.",
    tilt: "-1deg",
  },
  {
    Icon: Clock4,
    title: "Antrian makin panjang",
    desc: "Proses transaksi lambat saat ramai. Pelanggan kabur sebelum sempat bayar.",
    tilt: "1.4deg",
  },
  {
    Icon: TrendingDown,
    title: "Tidak tahu yang laku",
    desc: "Produk mana yang untung, mana yang bikin rugi? Keputusan cuma berdasar feeling.",
    tilt: "-1.3deg",
  },
  {
    Icon: HelpCircle,
    title: "Data tersebar di mana-mana",
    desc: "Catatan di HP, nota di laci, stok di kepala. Tidak ada satu sumber kebenaran.",
    tilt: "1deg",
  },
];

export default function ProblemSection() {
  return (
    <section id="masalah" className="relative z-[1] py-20 px-4 sm:px-6 bg-brand-cream overflow-hidden">
      {/* Shape parallax dekoratif — melayang berlawanan arah scroll */}
      <Parallax speed={0.5} aria-hidden="true" className="pointer-events-none absolute -left-10 top-24 -z-0">
        <div className="w-28 h-28 bg-[#FF3B3B]/15 border-3 border-[#FF3B3B]/30 rotate-12" />
      </Parallax>
      <Parallax speed={-0.4} aria-hidden="true" className="pointer-events-none absolute right-6 bottom-16 -z-0">
        <div className="w-20 h-20 rounded-full bg-[#FFE500]/30 border-3 border-brand-black/20" />
      </Parallax>

      <div className="relative max-w-6xl mx-auto">

        {/* Header */}
        <Reveal className="mb-12 max-w-2xl">
          <div
            className="inline-block bg-[#FF3B3B] text-white px-3 py-1 text-xs font-mono font-black tracking-wider mb-4 border-2 border-brand-black"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            ✦ MASALAHNYA
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-brand-black tracking-tight font-grotesk leading-tight">
            Kelola toko manual itu{" "}
            <span className="relative inline-block">
              <span className="relative z-10">melelahkan.</span>
              <span
                className="absolute left-0 right-0 bottom-1 h-3 bg-[#FF3B3B]/30 -z-0"
                aria-hidden="true"
              />
            </span>
          </h2>
          <p className="mt-4 text-brand-black/60 font-medium text-lg">
            Setiap hari habis waktu untuk hal yang sama. Bukan jualannya yang
            susah — tapi <b>mengurus di belakangnya</b>.
          </p>
        </Reveal>

        {/* Grid pain points — muncul berurutan saat scroll */}
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" gap={0.08}>
          {PAINS.map((p) => (
            <StaggerItem key={p.title}>
              <div
                className="h-full bg-white border-3 border-brand-black p-6 flex flex-col gap-3 transition-transform duration-150 hover:rotate-0 hover:-translate-y-1"
                style={{ boxShadow: "4px 4px 0 #0A0A0A", transform: `rotate(${p.tilt})` }}
              >
                <div
                  className="w-12 h-12 bg-[#FFE5E5] border-2 border-brand-black flex items-center justify-center"
                  style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                >
                  <p.Icon size={22} className="text-[#FF3B3B]" strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-lg text-brand-black leading-tight font-grotesk">
                  {p.title}
                </h3>
                <p className="text-sm text-brand-black/60 font-medium leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Jembatan ke solusi */}
        <Reveal delay={0.1} className="mt-12 flex justify-center">
          <div className="flex items-center gap-3 font-grotesk font-black text-brand-black/70 text-lg">
            <span>Ada cara yang jauh lebih simpel</span>
            <span className="inline-block text-2xl animate-bounce" aria-hidden="true">↓</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
