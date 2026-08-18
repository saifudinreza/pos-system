"use client";

// ============================================================
// HeroSection — Hero utama landing page KasirAI
//
// Tujuan: first impression yang BOLD + bercerita.
//  - Kolom kiri: copy yang masuk berurutan (stagger entrance)
//  - Kolom kanan: "stage" collage UI yang hidup (chart, AI chat,
//    order ticker, stamp LUNAS, stok menipis)
//
// Responsif SEMUA device: collage didesain di frame tetap
// (DESIGN_W x DESIGN_H) lalu DI-SCALE proporsional mengikuti
// lebar container via ResizeObserver — jadi tidak pernah
// disembunyikan di HP/tablet, hanya mengecil rapi.
//
// Parallax: tilt halus mengikuti mouse + pergeseran saat scroll
// (Framer Motion). Semua animasi MENGHORMATI reduced-motion.
// ============================================================

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";

// Ukuran "kanvas" desain collage (px). Semua elemen absolut
// diposisikan relatif terhadap frame ini, lalu di-scale.
const DESIGN_W = 520;
const DESIGN_H = 600;

// Versi Link & anchor yang bisa di-animasi (untuk hover spring)
const MotionLink = motion.create(Link);

// Properti hover untuk tombol CTA — spring "memantul" + shadow tumbuh + miring
// (sengaja TANPA whileTap supaya tidak "gerak-gerak" saat dipencet)
const ctaHover = { scale: 1.07, y: -6, rotate: -1.4, boxShadow: "12px 12px 0 #0A0A0A" };
const ctaSpring = { type: "spring", stiffness: 460, damping: 14 };

// ======================================================
// BarChart — Bar animasi yang tumbuh dari bawah saat mount
//
// Data statis 7 hari (SEN–MIN); tinggi bar = proporsi pct.
// Animasi: scaleY dari 0 → pct/100 dengan jeda bertahap
// (0.1 + index × 0.08s) supaya terasa "mengalir" dari kiri.
// ======================================================
const BarChart = () => {
  const [animated, setAnimated] = useState(false);
  // Data bar: pct = tinggi relatif (persen), isTop = bar tertinggi (TERLARIS)
  const bars = [
    { day: "SEN", pct: 55 },
    { day: "SEL", pct: 42 },
    { day: "RAB", pct: 72 },
    { day: "KAM", pct: 48 },
    { day: "JUM", pct: 88, isTop: true },
    { day: "SAB", pct: 62 },
    { day: "MIN", pct: 50 },
  ];

  useEffect(() => {
    // Jeda 400ms setelah mount → baru bar mulai tumbuh
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "relative", height: "170px",
      border: "2px solid #0A0A0A", background: "#fff",
      padding: "14px 12px 28px",
      display: "flex", alignItems: "flex-end",
      justifyContent: "space-between", gap: "10px",
    }}>
      {bars.map((bar, i) => (
        <div key={bar.day} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", height: "100%", justifyContent: "flex-end",
          position: "relative", zIndex: 1,
        }}>
          {bar.isTop && (
            <div style={{
              position: "absolute", top: "-14px", left: "50%",
              transform: "translateX(-50%) rotate(-4deg)",
              background: "#FF3B3B", color: "#fff",
              border: "2px solid #0A0A0A",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800, fontSize: "9px",
              padding: "2px 6px", letterSpacing: ".06em",
              whiteSpace: "nowrap", boxShadow: "2px 2px 0 #0A0A0A",
              opacity: animated ? 1 : 0,
              transition: "opacity 0.3s 0.9s",
            }}>
              TERLARIS
            </div>
          )}
          <div style={{
            width: "100%",
            background: bar.isTop ? "#FFE500" : "#0A0A0A",
            border: "2px solid #0A0A0A",
            transformOrigin: "bottom",
            transform: animated ? `scaleY(${bar.pct / 100})` : "scaleY(0)",
            transition: `transform 0.9s cubic-bezier(.2,.9,.3,1.2) ${0.1 + i * 0.08}s`,
            height: "100%",
          }} />
          <div style={{
            position: "absolute", bottom: "-22px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px", fontWeight: 700, letterSpacing: ".04em",
          }}>
            {bar.day}
          </div>
        </div>
      ))}
    </div>
  );
};

// ======================================================
// AIChat — Percakapan AI yang BERPUTAR terus-menerus
//  user bertanya → indikator mengetik → bot menjawab → ulang
// ======================================================
const TYPING = "typing";
// Daftar percakapan yang diputar bergantian (idx berputar modulo panjang)
const CONVO = [
  {
    q: "Produk apa paling laku minggu ini?",
    a: (
      <>
        <b style={{ color: "#FFE500" }}>Nasi Goreng Spesial</b> — 312 porsi,
        Rp 4,7jt. Bundle dengan Es Teh → +23% margin.
      </>
    ),
  },
  {
    q: "Stok mana yang harus direorder?",
    a: (
      <>
        <b style={{ color: "#FFE500" }}>Es Kopi Susu</b> sisa 8 cup — habis ~besok.
        Reorder min. 40 cup sekarang ⚡
      </>
    ),
  },
  {
    q: "Jam berapa paling ramai?",
    a: (
      <>
        Peak di <b style={{ color: "#FFE500" }}>12.00–13.00</b> & 19.00.
        Tambah 1 staf kasir saat jam itu.
      </>
    ),
  },
];

/**
 * TypingDots — 3 titik mengetik yang bergoyang (indikator AI "berpikir").
 * Animasi repeat:Infinity — setiap titik berdelay 0.18s.
 */
const TypingDots = () => (
  <span style={{ display: "inline-flex", gap: "4px", alignItems: "center", padding: "2px 2px" }}>
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, ease: "easeInOut", repeat: Infinity, delay: i * 0.18 }}
        style={{
          width: "6px", height: "6px", borderRadius: "50%", background: "#FFE500",
          display: "inline-block",
        }}
      />
    ))}
  </span>
);

/**
 * AIChat — simulasi percakapan AI yang berputar terus-menerus.
 *
 * Mesin state 3 fase (per pertanyaan di CONVO[idx]):
 *   phase 1  → tampil pertanyaan user
 *   phase TYPING → indikator mengetik
 *   phase 2  → tampil jawaban bot, lalu loop ke pertanyaan berikutnya
 * Timing (ms): 1400 → 1100 → 2600, lalu ulang.
 */
const AIChat = () => {
  // Hero showcase: chat SELALU bergerak, tidak tergantung setting OS (sesuai permintaan)
  const reduce = false;
  // phase: 0 = kosong, 1 = tampil pertanyaan, "typing", 2 = tampil jawaban
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    let t;
    if (phase === 1) t = setTimeout(() => setPhase(TYPING), 1400);
    else if (phase === TYPING) t = setTimeout(() => setPhase(2), 1100);
    else if (phase === 2) t = setTimeout(() => {
      setPhase(1);
      setIdx((i) => (i + 1) % CONVO.length);
    }, 2600);
    return () => clearTimeout(t);
  }, [phase, reduce]);

  const item = CONVO[idx];

  return (
    <div style={{
      padding: "14px", minHeight: "120px",
      display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px",
    }}>
      <AnimatePresence mode="popLayout">
        {/* Pertanyaan user */}
        <motion.div
          key={`q-${idx}`}
          initial={reduce ? false : { opacity: 0, x: 24, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          style={{
            alignSelf: "flex-end", padding: "8px 12px",
            background: "#FFE500", color: "#0A0A0A",
            border: "2px solid #FFE500", maxWidth: "88%", lineHeight: 1.4,
          }}
        >
          {item.q}
        </motion.div>

        {/* Indikator mengetik */}
        {phase === TYPING && (
          <motion.div
            key={`t-${idx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              alignSelf: "flex-start", padding: "8px 12px",
              border: "2px solid #fff", lineHeight: 1.4,
            }}
          >
            <TypingDots />
          </motion.div>
        )}

        {/* Jawaban bot */}
        {phase === 2 && (
          <motion.div
            key={`a-${idx}`}
            initial={reduce ? false : { opacity: 0, x: -24, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            style={{
              alignSelf: "flex-start", padding: "8px 12px",
              background: "transparent", color: "#fff",
              border: "2px solid #fff", maxWidth: "88%", lineHeight: 1.4,
            }}
          >
            {item.a}
            <motion.span
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1, ease: "linear", repeat: Infinity }}
              style={{
                display: "inline-block", width: "8px", height: "14px",
                background: "#FFE500", verticalAlign: "-2px", marginLeft: "2px",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ======================================================
// StampRays — 16 sinar berputar di sekitar stamp LUNAS
// ======================================================
/**
 * StampRays — dekorasi stamp "LUNAS": sinar berputar searah jarum jam
 * + cincin putus-putus berlawanan arah (kesan "cap keluar dari mesin").
 *
 * Props:
 *   visible: true → opacity 1 (dipicu setelah jeda di HeroStage)
 *   reduce : true → matikan rotasi (reduced-motion)
 */
const StampRays = ({ visible, reduce }) => (
  <>
    {/* Sinar yang berputar searah jarum jam (JS-driven → pasti jalan) */}
    <motion.div
      animate={reduce || !visible ? undefined : { rotate: 360 }}
      transition={reduce ? undefined : { duration: 9, repeat: Infinity, ease: "linear" }}
      style={{
        position: "absolute", inset: "-14px", pointerEvents: "none",
        opacity: visible ? 1 : 0, transition: "opacity 0.3s",
      }}
    >
      {Array.from({ length: 18 }, (_, i) => (
        // Sinar: panjang berselang (18px/12px), warna kuning tiap ke-3,
        // diputar 20° per sinar mengelilingi tengah stamp
        <div key={i} style={{
          position: "absolute", left: "50%", top: "50%",
          width: "3px", height: i % 2 ? "18px" : "12px",
          background: i % 3 === 0 ? "#FFE500" : "#0A0A0A",
          transformOrigin: "50% -12px",
          transform: `rotate(${i * 20}deg)`,
        }} />
      ))}
    </motion.div>
    {/* Cincin putus-putus berputar berlawanan arah → rotasi makin terasa */}
    <motion.div
      animate={reduce || !visible ? undefined : { rotate: -360 }}
      transition={reduce ? undefined : { duration: 12, repeat: Infinity, ease: "linear" }}
      style={{
        position: "absolute", inset: "-4px", borderRadius: "50%",
        border: "2.5px dashed #0A0A0A", pointerEvents: "none",
        opacity: visible ? 0.9 : 0, transition: "opacity 0.3s",
      }}
    />
  </>
);

// ======================================================
// OrderTicker — Pesanan masuk berganti tiap 2 detik dengan slide
// ======================================================
/**
 * OrderTicker — ticker pesanan masuk yang berganti tiap 2,2 detik.
 * Setiap pergantian: key=ticks → motion.div re-mount → slide dari atas.
 * Data pesanan statis (inv, waktu, nominal, metode bayar).
 */
const OrderTicker = () => {
  // Data ticker — diputar melingkar (modulo) mengikuti interval
  const orders = [
    { inv: "#3829", time: "2 mnt", amt: "Rp 45.000", pay: "QRIS", payBg: "#0066FF", payFg: "#fff" },
    { inv: "#3830", time: "barusan", amt: "Rp 25.000", pay: "Cash", payBg: "#FFE500", payFg: "#0A0A0A" },
    { inv: "#3831", time: "5 mnt", amt: "Rp 78.000", pay: "Transfer", payBg: "#00C27C", payFg: "#fff" },
  ];
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Interval 2,2 detik: ganti index pesanan + naikkan counter tick
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % orders.length);
      setTick((k) => k + 1);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const o = orders[idx];
  return (
    <div style={{
      padding: "8px 12px", height: "80px", overflow: "hidden",
      display: "flex", alignItems: "center",
    }}>
      <motion.div
        key={tick}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.9, 0.3, 1.2] }}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "6px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px", fontWeight: 600,
        }}
      >
        <span style={{ fontWeight: 700 }}>{o.inv}</span>
        <span style={{ color: "#9CA3AF", fontSize: "10px" }}>{o.time}</span>
        <span style={{ fontWeight: 700 }}>{o.amt}</span>
        <span style={{
          fontSize: "9px", padding: "1px 5px",
          border: "1.5px solid #0A0A0A",
          background: o.payBg, color: o.payFg,
          fontWeight: 700, letterSpacing: ".04em",
        }}>
          {o.pay}
        </span>
      </motion.div>
    </div>
  );
};

// ======================================================
// HeroStage — collage kanan, di-scale agar responsif
// ======================================================
/**
 * HeroStage — "stage" collage UI di kanan hero.
 *
 * Cara kerja responsif: canvas tetap DESIGN_W×DESIGN_H (520×600),
 * lalu di-scale proporsional mengikuti lebar container via
 * ResizeObserver — collage tidak pernah disembunyikan di layar kecil.
 *
 * Isi collage (urutan kedalaman 3D dari belakang ke depan):
 * dekorasi geometris → dashboard window → stamp LUNAS →
 * order ticker → stock alert → AI chat panel.
 */
function HeroStage() {
  // Hero showcase: 3D + animasi SELALU aktif, tidak tergantung setting OS (sesuai permintaan)
  const reduce = false;
  const clipRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [stampVisible, setStampVisible] = useState(false);

  // Stamp LUNAS muncul setelah jeda
  useEffect(() => {
    const t = setTimeout(() => setStampVisible(true), 1600);
    return () => clearTimeout(t);
  }, []);

  // Scale collage proporsional mengikuti lebar container:
  // ResizeObserver memantau lebar konten → scale = min(1, lebar / kanvas)
  useEffect(() => {
    const el = clipRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      // Sedikit "udara" di sisi kiri-kanan agar shadow tidak terpotong
      setScale(Math.min(1, w / (DESIGN_W + 24)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Mouse-tilt parallax DIHAPUS (sesuai permintaan: tidak lagi "goyang" saat
  // kena kursor). Animasi otomatis (float, LUNAS, AI chat) tetap jalan.

  // Tinggi wadah = tinggi canvas × scale (biar halaman tidak melompat)
  const scaledH = DESIGN_H * scale;

  return (
    <div
      ref={clipRef}
      style={{
        position: "relative",
        width: "100%",
        height: scaledH,
        perspective: "1000px",
      }}
    >
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1], delay: 0.15 }}
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: DESIGN_W,
          height: DESIGN_H,
          transformOrigin: "top center",
          // gabung: center (-50%) + scale responsif + tilt parallax
          x: "-50%",
          scale,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Lapisan idle-float: bikin seluruh collage "bernapas" terus-menerus
            (naik-turun + miring halus) walau mouse diam. Dimatikan saat reduce. */}
        <motion.div
          animate={reduce ? undefined : { y: [0, -14, 0], rotateZ: [-0.8, 0.8, -0.8], rotateY: [-5, 5, -5] }}
          transition={reduce ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}
        >
          {/* ===== Bagian: dekorasi geometris (lapisan paling belakang) ===== */}
          {/* Dekorasi geometris — translateZ negatif → di "belakang", parallax saat tilt */}
          <div style={{
            position: "absolute", width: "130px", height: "130px",
            background: "#FF7AB6", border: "2.5px solid #0A0A0A",
            top: 0, right: "6%", transform: "rotate(10deg) translateZ(-60px)",
            boxShadow: "6px 6px 0 #0A0A0A",
          }} />
          <div style={{
            position: "absolute", width: "76px", height: "76px",
            background: "#0066FF", border: "2.5px solid #0A0A0A",
            bottom: "30px", right: 0, borderRadius: "50%",
            boxShadow: "5px 5px 0 #0A0A0A",
            transform: "translateZ(-40px)",
          }} />
          <div style={{
            position: "absolute", width: "58px", height: "58px",
            background: "#8B5CF6", border: "2.5px solid #0A0A0A",
            top: "46%", left: "-6px", transform: "rotate(-12deg) translateZ(-30px)",
            boxShadow: "5px 5px 0 #0A0A0A",
          }} />

          {/* Ping dots — titik berdenyut dekoratif (CSS class hero-ping) */}
          <div className="hero-ping" style={{ top: "38%", left: "30%" }} />
          <div className="hero-ping" style={{ top: "16%", right: "34%" }} />

          {/* ===== Bagian: Dashboard Window (depth sedang) ===== */}
          <div style={{
            position: "absolute", top: "18px", left: "8px", width: "420px",
            background: "#fff", border: "2.5px solid #0A0A0A",
            boxShadow: "10px 10px 0 #0A0A0A",
            transform: "rotate(-1.5deg) translateZ(20px)",
          }}>
            {/* Titlebar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: "#0A0A0A", color: "#fff",
              borderBottom: "2.5px solid #0A0A0A",
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {["#FF3B3B", "#FFE500", "#00C27C"].map((c, i) => (
                  <span key={i} style={{
                    width: "11px", height: "11px", borderRadius: "50%",
                    border: "1.5px solid #fff", background: c, display: "block",
                  }} />
                ))}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                background: "#222", border: "1.5px solid #555",
                padding: "3px 10px", color: "#ccc",
              }}>
                sikasirai.com/dashboard
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                color: "#FFE500", fontWeight: 700, letterSpacing: ".06em",
              }}>
                ● LIVE
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "18px" }}>
              <div style={{
                display: "flex", alignItems: "baseline",
                justifyContent: "space-between", marginBottom: "14px",
              }}>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800, fontSize: "16px", letterSpacing: "-.02em",
                }}>
                  Penjualan Minggu Ini
                  <span style={{
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px", fontWeight: 500, color: "#666",
                    textTransform: "uppercase", letterSpacing: ".06em", marginTop: "2px",
                  }}>
                    Senin 18 – Minggu 24 Mei
                  </span>
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                  fontWeight: 700, background: "#00C27C", color: "#fff",
                  padding: "3px 8px", border: "1.5px solid #0A0A0A",
                  display: "inline-flex", alignItems: "center", gap: "4px",
                }}>
                  ↑ REALTIME
                </div>
              </div>

              {/* Stat Strip — 3 kartu ringkas (Revenue, Order, AOV) */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px", marginBottom: "16px",
              }}>
                {[
                  { label: "Revenue", val: "Rp 4,7jt", trend: "↑ 18%", bg: "#FFE500" },
                  { label: "Order", val: "312", trend: "↑ 12%", bg: "#FFFBEB" },
                  { label: "AOV", val: "Rp 15k", trend: "→ stabil", bg: "#F5F5F5", trendColor: "#0066FF" },
                ].map((s) => (
                  <div key={s.label} style={{ border: "2px solid #0A0A0A", padding: "8px 10px", background: s.bg }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                      fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: ".06em", color: "#333",
                    }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
                      fontSize: "18px", letterSpacing: "-.02em", marginTop: "2px",
                    }}>
                      {s.val}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                      fontWeight: 700, color: s.trendColor || "#00C27C", marginTop: "2px",
                    }}>
                      {s.trend}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart mingguan — komponen BarChart di atas */}
              <BarChart />
            </div>
          </div>

          {/* ===== Bagian: Stamp LUNAS ===== */}
          {/* Outer: jaga kedalaman 3D (translateZ) untuk parallax saat tilt */}
          <div style={{
            position: "absolute", top: "44px", right: "30px",
            width: "110px", height: "110px",
            transform: "translateZ(55px)", transformStyle: "preserve-3d",
          }}>
            {/* Entrance: melenting masuk sambil BERPUTAR dari -200° → -12° */}
            <motion.div
              initial={reduce ? { scale: 1, rotate: -12 } : { scale: 0, rotate: -200 }}
              animate={
                stampVisible
                  ? { scale: 1, rotate: -12 }
                  : (reduce ? { scale: 1, rotate: -12 } : { scale: 0, rotate: -200 })
              }
              transition={{ type: "spring", stiffness: 170, damping: 11 }}
              style={{
                width: "100%", height: "100%",
                background: "#00C27C", color: "#fff",
                border: "3px solid #0A0A0A", borderRadius: "50%",
                boxShadow: "6px 6px 0 #0A0A0A", overflow: "visible",
              }}
            >
              {/* Wobble halus terus-menerus → stamp terasa "hidup" */}
              <motion.div
                animate={reduce ? undefined : { rotate: [-4, 4, -4] }}
                transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute", inset: 0,
                  display: "grid", placeItems: "center", textAlign: "center",
                }}
              >
                <StampRays visible={stampVisible} reduce={reduce} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800, fontSize: "22px", letterSpacing: ".02em",
                  }}>
                    LUNAS
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", marginTop: "2px",
                  }}>
                    PAID · QRIS
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* ===== Bagian: Order Ticker ===== */}
          <div style={{
            position: "absolute", right: "-6px", top: "238px", width: "210px",
            background: "#fff", border: "2.5px solid #0A0A0A",
            boxShadow: "5px 5px 0 #0A0A0A",
            transform: "rotate(4deg) translateZ(45px)", overflow: "hidden",
          }}>
            <div style={{
              background: "#0A0A0A", color: "#FFE500", padding: "6px 10px",
              fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
              fontWeight: 700, letterSpacing: ".06em",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span className="hero-dot-red" />
              ORDER MASUK
            </div>
            <OrderTicker />
          </div>

          {/* ===== Bagian: Stock Alert ===== */}
          <div style={{
            position: "absolute", top: "396px", right: "8px", width: "196px",
            background: "#FF6B00", color: "#fff",
            border: "2.5px solid #0A0A0A", boxShadow: "5px 5px 0 #0A0A0A",
            padding: "10px 12px", transform: "rotate(-3deg) translateZ(35px)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <motion.div
              animate={{ rotate: [0, -8, 0, 8, 0] }}
              transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
              style={{
                width: "34px", height: "34px", minWidth: "34px",
                background: "#fff", color: "#FF6B00",
                border: "2px solid #0A0A0A",
                display: "grid", placeItems: "center",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800, fontSize: "18px",
              }}
            >
              !
            </motion.div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "13px", lineHeight: 1.2 }}>
              Stok Menipis
              <span style={{
                display: "block",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px", fontWeight: 500, opacity: 0.9, marginTop: "2px",
              }}>
                Es Kopi Susu · sisa 8
              </span>
            </div>
          </div>

          {/* ===== Bagian: AI Chat Panel (lapisan paling depan) ===== */}
          <div style={{
            position: "absolute", top: "452px", left: "0", width: "330px",
            background: "#0A0A0A", color: "#fff",
            border: "2.5px solid #0A0A0A",
            boxShadow: "8px 8px 0 #FFE500, 8px 8px 0 2.5px #0A0A0A",
            transform: "rotate(2.2deg) translateZ(70px)",
          }}>
            <div style={{
              padding: "10px 14px", borderBottom: "2px solid #333",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                fontWeight: 700, letterSpacing: ".08em",
                textTransform: "uppercase", color: "#FFE500",
              }}>
                <span style={{
                  width: "8px", height: "8px", background: "#00C27C",
                  borderRadius: "50%", boxShadow: "0 0 8px #00C27C",
                  display: "inline-block",
                }} />
                AI Assistant
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#888" }}>
                Groq · LLaMA 3.3
              </div>
            </div>

            <AIChat />

            <div style={{
              padding: "8px 12px", borderTop: "2px solid #333",
              display: "flex", alignItems: "center", gap: "8px",
              background: "#1a1a1a",
            }}>
              <div style={{
                flex: 1, fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px", color: "#777",
                border: "1.5px solid #444", padding: "4px 8px", background: "#0a0a0a",
              }}>
                Tanya apa saja tentang bisnismu...
              </div>
              <div style={{
                background: "#FFE500", color: "#0A0A0A",
                border: "1.5px solid #FFE500", padding: "4px 8px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800, fontSize: "10px", cursor: "pointer",
              }}>
                KIRIM →
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ======================================================
// HeroSection — gabungan copy kiri + stage kanan
// ======================================================
/**
 * HeroSection — hero utama landing page (lihat header file).
 * Tanpa props. Terdiri dari kolom kiri (copy dengan stagger entrance)
 * dan kolom kanan (HeroStage — collage UI live).
 */
export default function HeroSection() {
  // Hero showcase: animasi SELALU aktif, tidak tergantung setting OS (sesuai permintaan)
  const reduce = false;

  // Scroll parallax: stage bergeser pelan saat halaman digulir
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Kolom kanan (stage) bergeser lebih cepat dari kolom kiri (copy) → kesan kedalaman
  const stageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 40]);

  // Variants entrance kolom kiri (stagger):
  // container → orchestrator, item → tiap elemen copy (fade + slide-up 22px)
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  };
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 0.61, 0.36, 1] } },
  };

  // Headline: tiap baris "terbalik" dari sumbu-X lalu berdiri (efek 3D flip)
  const h1Container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const line = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, rotateX: -85, y: 14 },
    show: {
      opacity: 1,
      rotateX: 0,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 0.61, 0.36, 1] },
    },
  };

  return (
    <section ref={sectionRef} style={{ position: "relative", zIndex: 1 }}>
      <div className="hero-section-grid">

        {/* ===== Bagian: kolom kiri (copy) ===== */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ display: "flex", flexDirection: "column", y: copyY }}
        >
          {/* Eyebrow */}
          <motion.div variants={item} style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: "#fff", border: "2.5px solid #0A0A0A",
            padding: "8px 14px", boxShadow: "3px 3px 0 #0A0A0A",
            fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
            fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase",
            width: "fit-content", marginBottom: "24px",
          }}>
            <span className="hero-dot" />
            POS + AI ASSISTANT
          </motion.div>

          {/* H1 — di-animasikan per baris dengan efek 3D flip */}
          <motion.h1
            variants={h1Container}
            style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
              fontSize: "clamp(38px, 5.4vw, 82px)", lineHeight: 0.95,
              letterSpacing: "-.035em", marginBottom: "24px",
              perspective: "700px",
              transformStyle: "preserve-3d",
            }}
          >
            <motion.span variants={line} style={{ display: "block", transformOrigin: "top center" }}>
              Kasir yang{" "}
            </motion.span>

            <motion.span variants={line} style={{ display: "block", transformOrigin: "top center", margin: "8px 0" }}>
              <motion.span
                animate={reduce ? undefined : { rotate: [-1.2, 1.2, -1.2], y: [0, -3, 0] }}
                transition={reduce ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background: "#FFE500", padding: "2px 10px",
                  display: "inline-block",
                  boxShadow: "6px 6px 0 #0A0A0A",
                  border: "2.5px solid #0A0A0A",
                }}
              >
                ngerti bisnis
              </motion.span>{" "}
            </motion.span>

            <motion.span variants={line} style={{ display: "block", transformOrigin: "top center" }}>
              kamu, bukan cuma{" "}
            </motion.span>

            <motion.span variants={line} style={{ display: "block", transformOrigin: "top center" }}>
              <span className="hero-strike">catat angka.</span>
            </motion.span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p variants={item} style={{
            maxWidth: "520px", fontSize: "clamp(16px, 2.2vw, 18px)", lineHeight: 1.55,
            color: "#222", marginBottom: "36px",
          }}>
            Kelola penjualan, stok, dan laporan di satu layar. Tanya AI Assistant
            langsung dalam Bahasa Indonesia —{" "}
            <b>&quot;produk apa yang paling laku bulan ini?&quot;</b>{" "}
            — dan dapat jawaban dalam hitungan detik.
          </motion.p>

          {/* CTA Buttons — hover spring (ctaHover/ctaSpring) + kilau sweep */}
          <motion.div variants={item} style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
            <MotionLink
              href="/register"
              className="btn-shine"
              whileHover={ctaHover}
              transition={ctaSpring}
              style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "16px",
                padding: "16px 24px", border: "2.5px solid #0A0A0A",
                background: "#FFE500", boxShadow: "5px 5px 0 #0A0A0A",
                textDecoration: "none", color: "#0A0A0A", display: "inline-block",
                position: "relative", overflow: "hidden",
              }}
            >
              Mulai Jualan Sekarang →
            </MotionLink>
            <motion.a
              href="#ai"
              className="btn-shine"
              whileHover={ctaHover}
              transition={ctaSpring}
              style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "16px",
                padding: "16px 24px", border: "2.5px solid #0A0A0A",
                background: "#fff", boxShadow: "5px 5px 0 #0A0A0A",
                textDecoration: "none", color: "#0A0A0A", display: "inline-block",
                position: "relative", overflow: "hidden",
              }}
            >
              Lihat Demo Kasir
            </motion.a>
          </motion.div>

          {/* Proof Stats — deretan angka + separator vertikal; null = garis pemisah */}
          <motion.div variants={item} style={{ display: "flex", gap: "28px", marginTop: "48px", alignItems: "center", flexWrap: "wrap" }}>
            {[
              { num: "11%", label: "Pajak otomatis" },
              null,
              { num: "5+", label: "Metode Bayar" },
              null,
              { num: "PDF·XLSX", label: "Export Laporan" },
              null,
              { num: "24/7", label: "AI Insight" },
            ].map((it, i) =>
              it === null ? (
                <div key={`d${i}`} style={{ width: "2.5px", height: "36px", background: "#0A0A0A", flexShrink: 0 }} />
              ) : (
                <div key={it.label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
                    fontSize: "clamp(16px, 1.8vw, 26px)", letterSpacing: "-.02em",
                  }}>
                    {it.num}
                  </div>
                  <div style={{
                    fontSize: "11px", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: ".06em", color: "#555",
                  }}>
                    {it.label}
                  </div>
                </div>
              )
            )}
          </motion.div>
        </motion.div>

        {/* ===== Bagian: kolom kanan (stage) ===== */}
        <motion.div className="hero-stage" style={{ y: stageY }}>
          <HeroStage />
        </motion.div>
      </div>
    </section>
  );
}
