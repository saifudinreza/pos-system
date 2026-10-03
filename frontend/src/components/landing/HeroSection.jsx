"use client";

// ============================================================
// HeroSection.jsx, bagian pertama landing page (design.md)
//
// Kolom kiri (5/12): badge, headline, subheadline, dua CTA, dan
// penanda kepercayaan. Kolom kanan (7/12): DeviceStage, iPad
// dengan layar Mode Kasir dan HP Android dengan layar Laporan,
// berputar 3D saat dibuka dan saat digulir.
// Animasi teks lewat CSS (globals.css, blok "Hero") supaya
// headline langsung dirender server tanpa menunggu JS.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import DeviceStage from "./hero/DeviceStage";
import DemoVideoModal from "./DemoVideoModal";
import { trackEvent } from "@/lib/analytics";

// Penanda kepercayaan, semuanya fakta produk (bukan angka karangan)
const TRUST = ["Paket Free Rp 0", "Struk otomatis ke WhatsApp", "Bayar QRIS (Pro)"];

export default function HeroSection() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Event funnel: pengunjung melihat landing page
  useEffect(() => {
    trackEvent("landing_view");
  }, []);

  return (
    <section
      className="relative overflow-hidden pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex items-center lg:min-h-[min(100svh,860px)]"
      style={{ zIndex: 1 }}
    >
      {/* Latar: pola titik tipis yang memudar ke tepi */}
      <div aria-hidden="true" className="hero-dots absolute inset-0 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
        {/* ===== KIRI: pesan utama ===== */}
        <div className="lg:col-span-5 flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="hero-badge-in inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-2 border-brand-black rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-black" />
            <span className="font-mono text-xs sm:text-[13px] font-bold tracking-wider text-brand-black">
              POS + ASISTEN AI
            </span>
          </div>

          <h1 className="font-grotesk font-extrabold text-[38px] sm:text-5xl lg:text-[56px] leading-[1.1] tracking-[-0.02em] text-brand-black mb-6">
            <span className="hero-line-in block" style={{ animationDelay: "80ms" }}>
              Kasir yang{" "}
              <span className="bg-brand-yellow rounded-lg px-2.5 whitespace-nowrap">ngerti bisnis</span>
            </span>
            <span className="hero-line-in block" style={{ animationDelay: "160ms" }}>
              kamu, bukan cuma
            </span>
            <span
              className="hero-line-in block text-[#5B5B5B] line-through decoration-brand-black decoration-[4px]"
              style={{ animationDelay: "240ms" }}
            >
              catat angka.
            </span>
          </h1>

          <p className="hero-sub-in text-base sm:text-lg lg:text-[19px] leading-relaxed text-[#5B5B5B] max-w-[52ch] mb-8">
            Penjualan, stok, dan laporan di satu layar, di tablet maupun HP. Tanya asisten AI dalam
            Bahasa Indonesia dan dapat jawabannya dalam hitungan detik.
          </p>

          <div className="hero-cta-in flex flex-col items-center lg:items-start gap-3.5">
            <div className="flex flex-wrap justify-center lg:justify-start gap-3.5">
              <Link
                href="/register"
                onClick={() => trackEvent("cta_click", { posisi: "hero", tujuan: "daftar" })}
                className="h-[52px] inline-flex items-center gap-2.5 px-6 bg-brand-yellow text-brand-black border-2 border-brand-black rounded-xl shadow-[4px_4px_0_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#0A0A0A] transition-[transform,box-shadow] duration-[120ms] font-grotesk font-bold text-[17px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-black"
              >
                Mulai Gratis
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>

              <button
                type="button"
                onClick={() => {
                  trackEvent("cta_click", { posisi: "hero", tujuan: "demo" });
                  setVideoModalOpen(true);
                }}
                className="h-[52px] inline-flex items-center gap-2.5 px-[22px] bg-transparent text-brand-black border-2 border-brand-black rounded-xl hover:bg-brand-black/5 transition-colors duration-[120ms] font-grotesk font-semibold text-[17px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-black"
              >
                <Play size={16} strokeWidth={2.2} />
                Lihat Demo Kasir
              </button>
            </div>
            <p className="text-sm text-[#5B5B5B]">Gratis, tanpa kartu kredit</p>
          </div>

          {/* Penanda kepercayaan */}
          <ul className="hero-cta-in mt-9 pt-5 border-t-2 border-[#E7E5DC] flex flex-wrap justify-center lg:justify-start gap-x-7 gap-y-3">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm font-semibold text-brand-black">
                <Check size={18} strokeWidth={2.2} aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ===== KANAN: panggung perangkat ===== */}
        <div className="lg:col-span-7 w-full max-w-3xl mx-auto lg:max-w-none">
          <DeviceStage />
        </div>
      </div>

      <DemoVideoModal open={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
    </section>
  );
}
