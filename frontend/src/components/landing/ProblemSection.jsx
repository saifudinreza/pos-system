"use client";

// ============================================================
// ProblemSection, "Ribetnya kelola toko manual"
//
// Posisi cerita: tepat setelah Hero. Tujuannya membuat user
// mengangguk, "iya, ini masalahku", sebelum kita tunjukkan
// solusinya di section berikutnya.
//
// Visual: tiga kartu "rasa sakit" (pain points) yang muncul
// berurutan saat scroll. Sengaja hanya tiga yang paling kuat dan
// dibuat lurus supaya cepat dibaca (audit desain, issue #10).
// ============================================================

import { NotebookPen, PackageX, FileSpreadsheet } from "lucide-react";
import { Reveal, Stagger, StaggerItem, Parallax } from "./motion";
import NeoCard from "@/components/ui/NeoCard";

// Daftar "rasa sakit" (pain points), tiap objek = satu kartu
const PAINS = [
  {
    Icon: NotebookPen,
    title: "Catat penjualan manual",
    desc: "Tulis di buku atau Excel satu per satu. Salah hitung, lupa catat, dan rawan selisih kas.",
  },
  {
    Icon: PackageX,
    title: "Stok sering meleset",
    desc: "Baru sadar barang habis saat pelanggan sudah di depan kasir. Reorder telat, omzet hilang.",
  },
  {
    Icon: FileSpreadsheet,
    title: "Laporan bikin pusing",
    desc: "Tutup buku tiap malam, rekap manual berjam-jam, dan tetap tidak yakin angkanya benar.",
  },
];

/**
 * ProblemSection, grid "masalah manual" dengan animasi stagger
 * (lihat header file). Tanpa props; konten dari konstanta PAINS.
 */
export default function ProblemSection() {
  return (
    <section id="masalah" className="relative z-[1] py-20 px-4 sm:px-6 overflow-hidden scroll-mt-28">
      {/* Shape parallax dekoratif, melayang berlawanan arah scroll */}
      <Parallax speed={0.5} aria-hidden="true" className="pointer-events-none absolute -left-10 top-24 -z-0">
        <div className="w-28 h-28 bg-danger/15 border-3 border-danger/30 rotate-12" />
      </Parallax>
      <Parallax speed={-0.4} aria-hidden="true" className="pointer-events-none absolute right-6 bottom-16 -z-0">
        <div className="w-20 h-20 rounded-full bg-brand-yellow/30 border-3 border-brand-black/20" />
      </Parallax>

      <div className="relative max-w-6xl mx-auto">

        {/* Header */}
        <Reveal className="mb-12 max-w-2xl">
          <div
            className="inline-block bg-danger text-white px-3 py-1 text-xs font-grotesk font-black tracking-wider mb-4 border-2 border-brand-black"
            style={{ boxShadow: "2px 2px 0 var(--ink)" }}
          >
             MASALAHNYA
          </div>
          <h2 className="text-h2 text-brand-black font-grotesk">
            Kelola toko manual itu{" "}
            <span className="relative inline-block">
              <span className="relative z-10">melelahkan.</span>
              <span
                className="absolute left-0 right-0 bottom-1 h-3 bg-danger/30 -z-0"
                aria-hidden="true"
              />
            </span>
          </h2>
          <p className="mt-4 text-brand-black/60 font-medium text-lg">
            Setiap hari habis waktu untuk hal yang sama. Bukan jualannya yang
            susah, tapi <b>mengurus di belakangnya</b>.
          </p>
        </Reveal>

        {/* Grid pain points, muncul berurutan saat scroll */}
        <Stagger className="grid md:grid-cols-3 gap-5" gap={0.08}>
          {PAINS.map((p) => (
            <StaggerItem key={p.title}>
              <NeoCard size="lg" className="h-full flex flex-col gap-3 transition-transform duration-150 hover:-translate-y-1">
                <div className="w-12 h-12 bg-danger/15 border-2 border-brand-black shadow-[2px_2px_0_var(--ink)] flex items-center justify-center">
                  <p.Icon size={22} className="text-danger" strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-h4 text-brand-black font-grotesk">
                  {p.title}
                </h3>
                <p className="text-sm text-brand-black/60 font-medium leading-relaxed">
                  {p.desc}
                </p>
              </NeoCard>
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
