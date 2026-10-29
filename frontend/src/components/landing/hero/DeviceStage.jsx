"use client";

// ============================================================
// DeviceStage.jsx, panggung hero "Satu Konter, Tiga Perangkat" (issue #22)
//
// Mesin POS (tengah), tablet di stand (kiri belakang, disembunyikan
// di HP), dan HP pemilik (kanan depan) di atas meja kuning neobrutal.
// Ketiga layar digerakkan satu alur transaksi (demoFlow.js).
//
// Aturan 3D (akar bug Safari iOS di issue #22): TIDAK ADA
// transform-style: preserve-3d lintas perangkat. Setiap perangkat
// memakai perspective() sendiri dan dirender datar ke panggung, jadi
// urutan depan-belakang murni dari z-index/urutan DOM dan perangkat
// tidak mungkin saling tembus.
//
// Lapisan per perangkat:
//   posisi (absolute)  >  parallax scroll (Framer, translate saja)
//   >  animasi masuk CSS (.hero-rise)  >  pose 3D statis  >  bingkai
// Panggung: tilt kursor (desktop, Framer spring) > goyang pelan (.hero-sway).
// Loop berhenti saat hero di luar layar atau tab tersembunyi;
// reduced motion menampilkan langkah terakhir tanpa animasi.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import PosTerminal from "./devices/PosTerminal";
import StandTablet from "./devices/StandTablet";
import Phone from "./devices/Phone";
import KasirScreen from "./KasirScreen";
import CustomerScreen from "./CustomerScreen";
import OrdersScreen from "./OrdersScreen";
import LaporanScreen from "./LaporanScreen";
import { FINAL_STEP, STEP_COUNT, STEP_MS } from "./demoFlow";

const TILT_MAX = 4; // derajat
const SPRING = { stiffness: 120, damping: 20 };
// Lama tiap langkah: langkah terakhir ditahan lebih lama supaya hasilnya terbaca
const STEP_DURATIONS = [STEP_MS, STEP_MS, STEP_MS, STEP_MS, STEP_MS + 300, STEP_MS * 2];

// `pos`: letak chip di atas meja kuning (≥640px). Di HP chip tampil sebagai baris di bawah panggung.
const LABELS = [
  { icon: Monitor,    text: "Mesin POS Android", pos: "left-[36%] top-[78%]" },
  { icon: Smartphone, text: "HP pemilik",        pos: "right-[24%] top-[87%]" },
  { icon: Tablet,     text: "Tablet + stand",    pos: "left-[4%] top-[66%]", desktopOnly: true },
];

/** Satu alur transaksi yang berulang, dijeda saat tidak terlihat. */
function useDemoStep(ref, enabled) {
  const [step, setStep] = useState(FINAL_STEP);

  useEffect(() => {
    if (!enabled) {
      setStep(FINAL_STEP);
      return;
    }
    const el = ref.current;
    let visible = false;
    let timer = null;
    let current = FINAL_STEP;

    const schedule = () => {
      timer = setTimeout(() => {
        current = (current + 1) % STEP_COUNT;
        setStep(current);
        schedule();
      }, STEP_DURATIONS[current]);
    };
    const sync = () => {
      const run = visible && document.visibilityState === "visible";
      if (run && !timer) schedule();
      if (!run && timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0.15 });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      clearTimeout(timer);
    };
  }, [ref, enabled]);

  return step;
}

export default function DeviceStage() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const step = useDemoStep(ref, !reduce);

  // Parallax ringan saat digulir: HP naik, tablet turun sedikit
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const phoneY  = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -48]);
  const tabletY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 24]);

  // Tilt mengikuti kursor, hanya untuk pointer presisi
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [TILT_MAX, -TILT_MAX]), SPRING);
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-TILT_MAX, TILT_MAX]), SPRING);

  const handleMove = (e) => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const linkVisible = step === 3 || step === 4;

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} className="relative w-full pt-4 pb-2" style={{ perspective: 1600 }}>
      <motion.div style={{ rotateX: tiltX, rotateY: tiltY, perspective: 1600 }}>
        <div className="hero-sway relative w-full aspect-[1.15/1] sm:aspect-[1.2/1]">
          {/* Meja kuning: datar, paling belakang */}
          <div
            aria-hidden="true"
            className="hero-rise absolute left-[2%] right-[2%] top-[50%] bottom-[4%] sm:top-[52%] sm:bottom-[6%] rounded-[24px] border-[3px] border-brand-black bg-brand-yellow"
            style={{ boxShadow: "8px 8px 0 var(--ink)" }}
          >
            <div className="absolute inset-0 rounded-[21px] opacity-40 hero-counter-grid" />
          </div>

          {/* Bayangan lembut di meja (statis, tanpa filter) */}
          <div aria-hidden="true" className="absolute hidden sm:block left-[3%] top-[54%] w-[36%] h-[8%] hero-floor-shadow" />
          <div aria-hidden="true" className="absolute left-[8%] sm:left-[30%] top-[60%] sm:top-[58%] w-[60%] sm:w-[46%] h-[9%] hero-floor-shadow" />
          <div aria-hidden="true" className="absolute right-[0%] top-[86%] sm:top-[82%] w-[30%] sm:w-[22%] h-[8%] hero-floor-shadow" />

          {/* ===== Tablet di stand (kiri belakang, desktop/tablet saja) ===== */}
          <div className="absolute hidden sm:block left-[0%] top-[13%] w-[40%] z-10">
            <motion.div style={{ y: tabletY }}>
              <div className="hero-rise" style={{ animationDelay: "260ms" }}>
                <div style={{ transform: "perspective(1100px) rotateY(22deg) rotateX(2deg)" }}>
                  <StandTablet label="Tablet di stand menampilkan daftar pesanan KasirAI, pesanan baru dari kasir muncul paling atas">
                    <OrdersScreen step={step} />
                  </StandTablet>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ===== Mesin POS layar ganda (tengah) ===== */}
          <div className="absolute left-[2%] sm:left-[22%] top-[6%] sm:top-[4%] w-[74%] sm:w-[58%] z-20">
            <div className="hero-rise" style={{ animationDelay: "120ms" }}>
              <div style={{ transform: "perspective(1400px) rotateY(-12deg) rotateX(3deg)" }}>
                <PosTerminal
                  label="Mesin POS Android menampilkan Mode Kasir KasirAI: grid produk, keranjang, total pembayaran, dan layar pelanggan"
                  customer={<CustomerScreen step={step} />}
                >
                  <KasirScreen step={step} />
                </PosTerminal>
              </div>
            </div>
          </div>

          {/* Garis aliran data POS → HP saat struk dikirim */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className={`absolute inset-0 z-[25] hidden sm:block pointer-events-none transition-opacity duration-300 ${linkVisible ? "opacity-100" : "opacity-0"}`}
          >
            <path
              d="M 70 26 C 80 18, 90 22, 89 34"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
              className="hero-dash"
            />
          </svg>

          {/* ===== HP pemilik (kanan depan) ===== */}
          <div className="absolute right-[0%] top-[28%] sm:top-[34%] w-[29%] sm:w-[21%] z-30">
            <motion.div style={{ y: phoneY }}>
              <div className="hero-rise" style={{ animationDelay: "400ms" }}>
                <div style={{ transform: "perspective(1000px) rotateY(-20deg) rotateZ(4deg)" }}>
                  <Phone label="HP pemilik menampilkan laporan penjualan KasirAI dan notifikasi struk terkirim ke WhatsApp">
                    <LaporanScreen step={step} />
                  </Phone>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Label perangkat di atas meja (≥640px) */}
          <ul className="hidden sm:block absolute inset-0 z-[35] pointer-events-none">
            {LABELS.map((l, i) => (
              <DeviceChip key={l.text} {...l} className={`hero-rise absolute ${l.pos}`} style={{ animationDelay: `${700 + i * 120}ms` }} />
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Label perangkat (HP): baris di bawah panggung */}
      <ul className="hero-rise sm:hidden mt-5 flex flex-wrap justify-center gap-2.5" style={{ animationDelay: "600ms" }}>
        {LABELS.filter((l) => !l.desktopOnly).map((l) => <DeviceChip key={l.text} {...l} />)}
      </ul>
    </div>
  );
}

function DeviceChip({ icon: Icon, text, className = "", style }) {
  return (
    <li
      className={`flex items-center gap-1.5 bg-white border-2 border-brand-black px-3 py-1.5 text-xs sm:text-sm font-grotesk font-bold text-brand-black whitespace-nowrap ${className}`}
      style={{ boxShadow: "3px 3px 0 var(--ink)", ...style }}
    >
      <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
      {text}
    </li>
  );
}
