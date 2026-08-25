"use client";

// ============================================================
// AISpotlightSection, SOROTAN untuk pembeda utama: AI Sidebar (Groq)
//
// Posisi cerita: setelah fitur umum, kita beri "panggung khusus"
// untuk hal yang bikin KasirAI beda, AI assistant bertenaga Groq
// yang super cepat dan paham data toko.
//
// Visual: background gelap + sorotan kuning (radial glow) yang
// bergerak halus mengikuti scroll → kesan "lampu panggung".
// Kanan: mock chat sidebar yang pesannya muncul berurutan saat
// masuk viewport. Semua hormati reduced-motion.
// ============================================================

import { useRef } from "react";
import Link from "next/link";
import { Zap, Database, MessageSquareText, ShieldCheck } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  Reveal,
  Stagger,
  StaggerItem,
  Parallax,
} from "./motion";

const BENEFITS = [
  {
    Icon: Zap,
    title: "Jawaban instan",
    desc: "Ditenagai Groq LPU, respon dalam hitungan detik, bukan menit.",
  },
  {
    Icon: Database,
    title: "Paham data tokomu",
    desc: "AI membaca penjualan & stok real-time, bukan jawaban template.",
  },
  {
    Icon: MessageSquareText,
    title: "Bahasa Indonesia natural",
    desc: "Tanya seperti ngobrol biasa, \"omzet minggu ini berapa?\"",
  },
  {
    Icon: ShieldCheck,
    title: "Actionable, bukan basa-basi",
    desc: "Rekomendasi konkret: produk bundling, reorder, jam ramai.",
  },
];

/**
 * ChatBubble, satu baris chat dalam mock sidebar (lihat header file).
 *
 * Props:
 *   role     : "user" (kuning, rata kanan) | "ai" (gelap, rata kiri)
 *   children : isi pesan (teks / JSX dengan highlight <b>)
 */
function ChatBubble({ role, children }) {
  const isUser = role === "user";
  return (
    <StaggerItem
      y={16}
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "90%",
      }}
    >
      <div
        style={{
          padding: "10px 13px",
          fontSize: "13px",
          lineHeight: 1.5,
          border: isUser ? "2px solid #FFE500" : "2px solid #333",
          background: isUser ? "#FFE500" : "#141414",
          color: isUser ? "#0A0A0A" : "#fff",
          fontWeight: isUser ? 600 : 400,
        }}
      >
        {children}
      </div>
    </StaggerItem>
  );
}

/**
 * AISpotlightSection, section sorotan AI (lihat header file).
 * Tanpa props; animasi glow mengikuti scroll via useScroll/useTransform,
 * dan mati otomatis saat user mengaktifkan reduced-motion.
 */
export default function AISpotlightSection() {
  const reduce = useReducedMotion();
  const ref = useRef(null);

  // Sorotan bergerak halus saat scroll:
  // scrollYProgress 0→1 di-mapping ke pergeseran x/y glow (persen).
  // reduced-motion → offset tetap 0 (tanpa gerak).
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-15%", "15%"]);
  const glowX = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["10%", "-10%"]);

  return (
    <section
      ref={ref}
      id="ai"
      className="relative z-[1] overflow-hidden bg-brand-black text-white py-24 px-4 sm:px-6"
    >
      {/* Sorotan radial kuning, "lampu panggung" */}
      <motion.div
        aria-hidden="true"
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none absolute -top-1/4 left-1/2 h-[120%] w-[120%] -translate-x-1/2"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(255,229,0,0.16), rgba(255,229,0,0.05) 35%, transparent 60%)",
          }}
        />
      </motion.div>

      {/* Grid titik dekoratif */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #FFE500 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Shape parallax dekoratif, melayang mengikuti scroll */}
      <Parallax speed={0.55} aria-hidden="true" className="pointer-events-none absolute left-6 top-16 -z-0">
        <div className="w-24 h-24 border-3 border-brand-yellow/25 rotate-12" />
      </Parallax>
      <Parallax speed={-0.5} aria-hidden="true" className="pointer-events-none absolute right-10 bottom-12 -z-0">
        <div className="w-16 h-16 rounded-full border-3 border-white/15" />
      </Parallax>

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* ===== KIRI: Narasi ===== */}
        <Reveal>
          <div
            className="inline-flex items-center gap-2 bg-brand-yellow text-brand-black px-3 py-1 text-xs font-mono font-black tracking-wider mb-5 border-2 border-brand-yellow"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-[#00C27C] animate-pulse" />
             PEMBEDA UTAMA · GROQ AI
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black tracking-tight font-grotesk leading-[0.98]">
            Punya{" "}
            <span className="text-brand-yellow">analis bisnis</span>
            <br />
            di sidebar kasirmu.
          </h2>

          <p className="mt-5 text-white/60 font-medium text-lg max-w-md">
            Bukan chatbot biasa. AI Assistant KasirAI terhubung langsung ke data
            tokomu dan menjawab dalam Bahasa Indonesia, secepat kamu sempat berpikir.
          </p>

          <Stagger className="mt-8 grid sm:grid-cols-2 gap-4" gap={0.1}>
            {BENEFITS.map((b) => (
              <StaggerItem key={b.title}>
                <div className="flex gap-3">
                  <div
                    className="shrink-0 w-10 h-10 bg-brand-yellow text-brand-black border-2 border-brand-yellow flex items-center justify-center"
                  >
                    <b.Icon size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-base font-grotesk leading-tight">{b.title}</h3>
                    <p className="text-sm text-white/50 font-medium mt-0.5">{b.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-9 flex flex-wrap gap-4 items-center">
            <Link
              href="/register"
              className="btn-shine relative overflow-hidden px-6 py-3.5 bg-brand-yellow text-brand-black border-2 border-brand-yellow font-black neo-hover inline-block"
              style={{ boxShadow: "4px 4px 0 #FFE500" }}
            >
              Coba AI Assistant →
            </Link>
            <span className="font-mono text-xs text-white/40 tracking-wider">
              Powered by Groq · LLaMA 3.3 70B
            </span>
          </div>
        </Reveal>

        {/* ===== KANAN: Mock chat sidebar ===== */}
        <Reveal delay={0.1} y={32}>
          <div
            className="relative bg-[#0d0d0d] border-3 border-brand-yellow"
            style={{ boxShadow: "10px 10px 0 #FFE500" }}
          >
            {/* Header sidebar */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-white/10 bg-[#141414]">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest uppercase text-brand-yellow">
                <span className="inline-block w-2 h-2 rounded-full bg-[#00C27C]" style={{ boxShadow: "0 0 8px #00C27C" }} />
                AI Assistant
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
                <Zap size={11} className="text-brand-yellow" />
                Groq · 0.4s
              </div>
            </div>

            {/* Body chat, pesan muncul berurutan saat masuk viewport */}
            <Stagger
              className="flex flex-col gap-3 p-4 min-h-[360px]"
              gap={0.55}
              style={{ alignItems: "stretch" }}
            >
              <ChatBubble role="user">Produk apa yang paling laku minggu ini?</ChatBubble>
              <ChatBubble role="ai">
                <b className="text-brand-yellow">Nasi Goreng Spesial</b>, 312 porsi (Rp 4,7jt).
                Naik <b className="text-[#00C27C]">+18%</b> dari minggu lalu. 
              </ChatBubble>

              <ChatBubble role="user">Ada saran biar margin naik?</ChatBubble>
              <ChatBubble role="ai">
                Bundling <b>Nasi Goreng + Es Teh</b> bisa angkat margin{" "}
                <b className="text-[#00C27C]">+23%</b>. 68% pembeli nasi goreng juga beli minuman.
              </ChatBubble>

              <ChatBubble role="user">Stok mana yang harus direorder?</ChatBubble>
              <ChatBubble role="ai">
                <b>Es Kopi Susu</b> sisa <b className="text-[#FF6B00]">8 cup</b>, habis ~besok siang.
                Reorder min. 40 cup sekarang. 
              </ChatBubble>
            </Stagger>

            {/* Input bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-t-2 border-white/10 bg-[#141414]">
              <div className="flex-1 font-mono text-[11px] text-white/40 border border-white/15 px-3 py-2 bg-black">
                Tanya apa saja tentang bisnismu...
              </div>
              <div className="bg-brand-yellow text-brand-black border border-brand-yellow px-3 py-2 font-grotesk font-black text-[11px]">
                KIRIM →
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
