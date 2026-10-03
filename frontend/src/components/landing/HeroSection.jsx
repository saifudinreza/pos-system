"use client";

// ============================================================
// HeroSection.jsx, bagian pertama landing page
//
// Kolom kiri: headline, penjelasan singkat, SATU CTA utama
// ("Mulai Gratis"), CTA kedua ("Lihat Demo Kasir" membuka video),
// dan tiga manfaat nyata. Kolom kanan: pratinjau aplikasi asli
// (HeroProductPreview) menggantikan foto ilustrasi.
// Latar sengaja polos supaya teks mudah dibaca.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import HeroProductPreview from "./HeroProductPreview";
import DemoVideoModal from "./DemoVideoModal";
import { trackEvent } from "@/lib/analytics";
import { neoButtonClass } from "@/components/ui/NeoButton";

// Tiga manfaat di bawah tombol. Semua benar sesuai aplikasi:
// paket Free gratis, struk WhatsApp otomatis, QRIS di paket Pro.
const BENEFITS = [
  { big: "Rp 0", label: "Mulai dengan paket Free" },
  { big: "Otomatis", label: "Struk ke WhatsApp" },
  { big: "QRIS", label: "Bayar digital (paket Pro)" },
];

export default function HeroSection() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Event funnel: pengunjung melihat landing page
  useEffect(() => {
    trackEvent("landing_view");
  }, []);

  return (
    <section
      className="relative min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex items-center overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* ===== KIRI: pesan utama ===== */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border-2 border-brand-black shadow-[2px_2px_0_var(--ink)] self-start mb-6"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <span className="font-grotesk text-xs font-bold tracking-wider text-brand-black">
              KASIR + AI ASSISTANT
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-grotesk text-display text-brand-black mb-6"
          >
            Kasir yang{" "}
            <span className="inline-block bg-brand-yellow px-3.5 py-0.5 border-[3px] border-brand-black shadow-[4px_4px_0_var(--ink)] my-1">
              ngerti bisnis
            </span>{" "}
            kamu, bukan cuma{" "}
            {/* Dicoret dengan garis tipis supaya hurufnya tetap terbaca */}
            <span className="text-brand-black/45 line-through decoration-danger decoration-[5px] whitespace-nowrap">
              catat angka.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-brand-black/80 font-medium leading-relaxed max-w-xl mb-8"
          >
            Kelola penjualan, stok, dan laporan di satu layar. Tanya AI Assistant dalam Bahasa Indonesia,{" "}
            <strong className="text-brand-black font-bold">&ldquo;produk apa yang paling laku minggu ini?&rdquo;</strong>
            , dan dapat jawabannya dalam hitungan detik.
          </motion.p>

          {/* CTA: satu tombol utama (hitam), satu pendukung (putih) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 mb-3"
          >
            <Link
              href="/register"
              onClick={() => trackEvent("cta_click", { posisi: "hero", tujuan: "daftar" })}
              className={neoButtonClass({ variant: "cta", size: "xl", className: "font-grotesk font-black" })}
            >
              <span>Mulai Gratis</span>
              <ArrowRight size={20} strokeWidth={2.5} />
            </Link>

            <button
              type="button"
              onClick={() => {
                trackEvent("cta_click", { posisi: "hero", tujuan: "demo" });
                setVideoModalOpen(true);
              }}
              className={neoButtonClass({ variant: "secondary", size: "lg", className: "font-grotesk" })}
            >
              <Play size={16} fill="#0A0A0A" />
              <span>Lihat Demo Kasir</span>
            </button>
          </motion.div>
          <p className="text-sm font-medium text-brand-black/60 mb-9">
            Tanpa kartu kredit. Paket Free gratis selamanya.
          </p>

          {/* Tiga manfaat nyata */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-brand-black/25 max-w-xl"
          >
            {BENEFITS.map((b, i) => (
              <div key={b.big} className={i > 0 ? "border-l-2 border-brand-black/15 pl-4" : ""}>
                <div className="font-grotesk font-black text-2xl text-brand-black">{b.big}</div>
                <div className="text-xs font-semibold text-brand-black/70 leading-snug">{b.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ===== KANAN: pratinjau aplikasi ===== */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end">
          <HeroProductPreview />
        </div>
      </div>

      <DemoVideoModal open={videoModalOpen} onClose={() => setVideoModalOpen(false)} />
    </section>
  );
}
