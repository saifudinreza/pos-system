"use client";

// ============================================================
// HeroSection.jsx — Landing Page Hero & Operational Workflow
//
// Mengimplementasikan tata letak sesuai gambar referensi:
// - Latar belakang suasana toko supermarket/ritel autentik
// - Kolom Kiri: Value proposition, headline dengan highlight [ngerti bisnis]
//   dan coretan "catat angka.", CTA ganda, dan pita metrik bisnis
// - Kolom Kanan: Matriks 4-Frame Alur Operasional Kasir (Retail POS,
//   Mobile Kasir, Tablet Kasir, dan AI Asisten Responsif) dengan
//   panah alur interaktif dinamis dan pita strategi animasi.
// ============================================================

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ScanBarcode,
  Smartphone,
  Tablet,
  Store,
  Bot,
  Zap,
  Play,
  X,
} from "lucide-react";

// Konfigurasi 4 Frame Operasional
const OPERATIONAL_FRAMES = [
  {
    id: 1,
    badge: "",
    highlightText: "",
    prefix: "",
    image: "/landing/frame1-retail.jpg",
    alt: "Operasi Kasir Retail Full-Service",
    description: "",
    stamp: "",
  },
  {
    id: 2,
    badge: "",
    highlightText: "",
    prefix: "",
    image: "/landing/frame2-mobile.jpg",
    alt: "Kasir Operasi via Mobile Smartphone",
    description: "",
  },
  {
    id: 3,
    badge: "",
    highlightText: "",
    prefix: "",
    image: "/landing/frame3-tablet.jpg",
    alt: "Kasir Operasi via Tablet Meja Kafe",
    description: "",
  },
  {
    id: 4,
    badge: "",
    highlightText: "",
    prefix: "",
    image: "/landing/frame4-ai.jpg",
    alt: "AI Asisten Yang Responsif",
    description: "",
  },
];

export default function HeroSection() {
  const [activeFrame, setActiveFrame] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Auto-cycle frame setiap 3.8 detik jika tidak sedang di-hover
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev % 4) + 1);
    }, 3800);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Mouse Parallax Effect
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 10, y: y * -10 });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex items-center overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Background Image — suasana toko supermarket/ritel autentik */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landing/bacground.jpeg')" }}
      />

      {/* Semi-transparent Backdrop Overlay — sangat tipis supaya background toko terlihat jelas */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,251,235,0.55) 0%, rgba(255,251,235,0.35) 35%, rgba(255,251,235,0.10) 65%, transparent 100%)",
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* ============================================================
            KOLOM KIRI: Value Proposition, Headline, CTA, & Stats
            ============================================================ */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          
          {/* Badge: POS • AI ASSISTANT */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border-2 border-brand-black shadow-[2px_2px_0_#0A0A0A] self-start mb-6"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C27C] animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-wider text-brand-black">
              POS • AI ASSISTANT
            </span>
          </motion.div>

          {/* Headline Utama */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-grotesk font-black text-4xl sm:text-5xl lg:text-[54px] leading-[1.08] text-brand-black tracking-tight mb-6"
          >
            Kasir yang{" "}
            <span className="inline-block bg-[#FFE500] px-3.5 py-0.5 border-[3px] border-[#0A0A0A] shadow-[4px_4px_0_#0A0A0A] my-1">
              ngerti bisnis
            </span>{" "}
            kamu, bukan cuma{" "}
            <span className="relative inline-block whitespace-nowrap">
              catat angka.
              {/* Garis Coretan Merah Tebal */}
              <span
                className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[7px] bg-[#FF3B3B] border-2 border-[#0A0A0A] transform -rotate-1 pointer-events-none"
                style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
              />
            </span>
          </motion.h1>

          {/* Deskripsi Kalimat Alami */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-brand-black/85 font-medium leading-relaxed max-w-xl mb-8"
          >
            Kelola penjualan, stok, dan laporan di satu layar. Tanya AI Assistant langsung dalam Bahasa Indonesia —{" "}
            <strong className="text-brand-black font-bold">
              "produk apa yang paling laku bulan ini?"
            </strong>{" "}
            — dan dapat jawaban dalam hitungan detik.
          </motion.p>

          {/* Tombol CTA Ganda */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4 mb-10"
          >
            <Link
              href="/register"
              className="px-6 py-3.5 bg-white border-[2.5px] border-brand-black font-grotesk font-black text-base text-brand-black shadow-[4px_4px_0_#0A0A0A] hover:bg-brand-yellow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#0A0A0A] transition-all flex items-center gap-2"
            >
              <span>Mulai Jualan Sekarang</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>

            <button
              type="button"
              onClick={() => setVideoModalOpen(true)}
              className="px-6 py-3.5 bg-white/80 backdrop-blur-sm border-[2.5px] border-brand-black font-grotesk font-bold text-base text-brand-black shadow-[3px_3px_0_#0A0A0A] hover:bg-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#0A0A0A] transition-all flex items-center gap-2"
            >
              <Play size={16} fill="#0A0A0A" />
              <span>Lihat Demo Kasir</span>
            </button>
          </motion.div>

          {/* Pita Metrik Bisnis Bawah */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t-2 border-brand-black/25 max-w-xl"
          >
            <div>
              <div className="font-grotesk font-black text-2xl text-brand-black">11%</div>
              <div className="font-mono text-[10px] font-bold text-brand-black/70 tracking-wider uppercase">
                Pajak Otomatis
              </div>
            </div>
            <div className="border-l-2 border-brand-black/15 pl-4">
              <div className="font-grotesk font-black text-2xl text-brand-black">5+</div>
              <div className="font-mono text-[10px] font-bold text-brand-black/70 tracking-wider uppercase">
                Metode Bayar
              </div>
            </div>
            <div className="border-l-2 border-brand-black/15 pl-4">
              <div className="font-grotesk font-black text-2xl text-brand-black">PDF-XLSX</div>
              <div className="font-mono text-[10px] font-bold text-brand-black/70 tracking-wider uppercase">
                Export Laporan
              </div>
            </div>
            <div className="border-l-2 border-brand-black/15 pl-4">
              <div className="font-grotesk font-black text-2xl text-brand-black">24/7</div>
              <div className="font-mono text-[10px] font-bold text-brand-black/70 tracking-wider uppercase">
                AI Insight
              </div>
            </div>
          </motion.div>
        </div>

        {/* ============================================================
            KOLOM KANAN: Matriks Alur Operasional 4-Frame
            ============================================================ */}
        <div
          className="lg:col-span-7 flex flex-col items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div
            animate={{
              rotateX: mousePos.y * 0.4,
              rotateY: mousePos.x * 0.4,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full max-w-[660px] bg-[#18181b] border-[3.5px] border-[#0A0A0A] shadow-[8px_10px_0_#0A0A0A] p-3 rounded-md relative"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* 2x2 Grid of Frames with Directional Arrows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative rounded-md">
              
              {/* --------------------------------------------------------
                  FRAME 1: Operasi Kasir Retail Full-Service
                  -------------------------------------------------------- */}
              <div
                onClick={() => setActiveFrame(1)}
                className={`relative border-[2.5px] border-[#0A0A0A] bg-black overflow-hidden cursor-pointer transition-all duration-300 rounded-sm ${
                  activeFrame === 1
                    ? "ring-4 ring-[#FFE500] shadow-[0_0_15px_rgba(255,229,0,0.5)] scale-[1.01]"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                {/* Photo Display */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src="/landing/frame1-retail.jpg"
                    alt="Kasir Retail Full-Service"
                    className="w-full h-full object-cover"
                  />

                  {/* Bottom Overlay Label */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 pb-2.5 px-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-[#FFE500] shadow-[1px_1px_0_#0A0A0A]">
                        <Store size={12} className="text-[#0A0A0A]" strokeWidth={2.5} />
                      </span>
                      <span className="font-mono text-[9px] sm:text-[10px] font-extrabold text-white tracking-tight leading-none">
                        KASIR <span className="text-[#FFE500]">RETAIL</span>
                      </span>
                      {activeFrame === 1 && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C27C] animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              

              {/* --------------------------------------------------------
                  FRAME 2: Kasir Operasi via Mobile
                  -------------------------------------------------------- */}
              <div
                onClick={() => setActiveFrame(2)}
                className={`relative border-[2.5px] border-[#0A0A0A] bg-black overflow-hidden cursor-pointer transition-all duration-300 rounded-sm ${
                  activeFrame === 2
                    ? "ring-4 ring-[#FFE500] shadow-[0_0_15px_rgba(255,229,0,0.5)] scale-[1.01]"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                {/* Photo Display */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src="/landing/frame2-mobile.jpg"
                    alt="Kasir Operasi via Mobile"
                    className="w-full h-full object-cover"
                  />

                  {/* Bottom Overlay Label */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 pb-2.5 px-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-[#FFE500] shadow-[1px_1px_0_#0A0A0A]">
                        <Smartphone size={12} className="text-[#0A0A0A]" strokeWidth={2.5} />
                      </span>
                      <span className="font-mono text-[9px] sm:text-[10px] font-extrabold text-white tracking-tight leading-none">
                        MOBILE <span className="text-[#FFE500]">POS</span>
                      </span>
                      {activeFrame === 2 && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C27C] animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

                  {/* --------------------------------------------------------
                  FRAME 3: Kasir Operasi via Tablet
                  -------------------------------------------------------- */}
              <div
                onClick={() => setActiveFrame(3)}
                className={`relative border-[2.5px] border-[#0A0A0A] bg-black overflow-hidden cursor-pointer transition-all duration-300 rounded-sm ${
                  activeFrame === 3
                    ? "ring-4 ring-[#FFE500] shadow-[0_0_15px_rgba(255,229,0,0.5)] scale-[1.01]"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                {/* Photo Display */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src="/landing/frame3-tablet.jpg"
                    alt="Kasir Operasi via Tablet"
                    className="w-full h-full object-cover"
                  />

                  {/* Bottom Overlay Label */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 pb-2.5 px-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-[#FFE500] shadow-[1px_1px_0_#0A0A0A]">
                        <Tablet size={12} className="text-[#0A0A0A]" strokeWidth={2.5} />
                      </span>
                      <span className="font-mono text-[9px] sm:text-[10px] font-extrabold text-white tracking-tight leading-none">
                        TABLET <span className="text-[#FFE500]">POS</span>
                      </span>
                      {activeFrame === 3 && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C27C] animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------
                  FRAME 4: AI Asisten Yang Responsif
                  -------------------------------------------------------- */}
              <div
                onClick={() => setActiveFrame(4)}
                className={`relative border-[2.5px] border-[#0A0A0A] bg-black overflow-hidden cursor-pointer transition-all duration-300 rounded-sm ${
                  activeFrame === 4
                    ? "ring-4 ring-[#FFE500] shadow-[0_0_15px_rgba(255,229,0,0.5)] scale-[1.01]"
                    : "opacity-90 hover:opacity-100"
                }`}
              >
                {/* Photo Display with Subtle Hologram Glow */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src="/landing/frame4-ai.jpg"
                    alt="AI Asisten Yang Responsif"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hologram Pulse Overlay */}
                  <motion.div
                    animate={{ opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-cyan-400/10 pointer-events-none mix-blend-screen"
                  />

                  {/* Bottom Overlay Label */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 pb-2.5 px-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded bg-[#FFE500] shadow-[1px_1px_0_#0A0A0A]">
                        <Bot size={12} className="text-[#0A0A0A]" strokeWidth={2.5} />
                      </span>
                      <span className="font-mono text-[9px] sm:text-[10px] font-extrabold text-white tracking-tight leading-none">
                        AI <span className="text-[#FFE500]">ASISTEN</span>
                      </span>
                      {activeFrame === 4 && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00C27C] animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Bottom Strategy Banner Ribbon */}
            <div className="mt-3 bg-[#e4e4e7] border-2 border-[#0A0A0A] px-3 py-2 text-center rounded-sm shadow-[2px_2px_0_#0A0A0A]">
              <span className="font-mono text-[8.5px] sm:text-[10px] font-black text-brand-black tracking-wider uppercase">
                KASIR RETAIL &bull; MOBILE &bull; TABLET &bull; AI ASISTEN &mdash; SATU PLATFORM, SEMUA PERANGKAT.
              </span>
            </div>
          </motion.div>

          {/* Navigasi Titik Indikator Bawah untuk Pemilihan Frame */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setActiveFrame(num)}
                aria-label={`Frame ${num}`}
                className={`h-2.5 transition-all duration-300 border-1.5 border-[#0A0A0A] ${
                  activeFrame === num
                    ? "w-8 bg-brand-yellow border-[#0A0A0A] shadow-[1px_1px_0_#0A0A0A]"
                    : "w-2.5 bg-white/70 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================
          MODAL PREVIEW VIDEO DEMO KASIR
          ============================================================ */}
      <AnimatePresence>
        {videoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-4xl bg-[#0A0A0A] border-3 border-[#FFE500] shadow-[8px_8px_0_#0A0A0A] p-2 rounded-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3 border-b-2 border-neutral-800 bg-neutral-900">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#00C27C]" />
                  <span className="font-grotesk font-extrabold text-sm text-white">
                    Demo Operasional Kasir & AI Asisten
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(false)}
                  className="p-1 text-white hover:text-brand-yellow transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video w-full bg-black">
                <video
                  src="/landing/dreamina-2026-09-12-6380-The camera smoothly pans down from the h.mp4"
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
