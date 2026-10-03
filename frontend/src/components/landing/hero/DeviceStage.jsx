"use client";

// ============================================================
// DeviceStage.jsx, panggung 3D di hero: iPad landscape + HP Android
//
// Transform dipisah per lapisan supaya nilainya tidak saling timpa:
//
//   Stage      perspective + tilt kursor (spring, desktop saja)
//   Entrance   animasi masuk CSS (.hero-tab-in / .hero-phone-in)
//   Scroll     rotate menuju datar saat halaman digulir (useTransform)
//   Idle       naik turun pelan (CSS)
//   Device     bingkai + isi layar
//
// Entrance berakhir di 0 derajat; kemiringan awal datang dari
// lapisan scroll (-14/6 untuk iPad, 16/4 untuk HP). Jumlah keduanya
// sama dengan sudut di design.md bagian 8.1.
// Entrance memakai CSS (bukan Framer) supaya perangkat tampil
// tanpa menunggu JS, dan angka sudutnya bisa dibagi dua di mobile
// lewat media query.
// ============================================================

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import KasirScreen from "./KasirScreen";
import LaporanScreen from "./LaporanScreen";

const TILT_MAX = 4; // derajat, design.md 8.4
const SPRING = { stiffness: 120, damping: 20 };

export default function DeviceStage() {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  // Faktor sudut: 1 di desktop/tablet, 0.5 di mobile (< 640px), 0 kalau reduced motion
  const angle = useMotionValue(1);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => angle.set(reduce ? 0 : mq.matches ? 0.5 : 1);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [angle, reduce]);

  // Rotate mengikuti scroll (design.md 8.2)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const tabRY   = useTransform([scrollYProgress, angle], ([p, k]) => -14 * k * (1 - p));
  const tabRX   = useTransform([scrollYProgress, angle], ([p, k]) => 6 * k * (1 - p));
  const phoneRY = useTransform([scrollYProgress, angle], ([p, k]) => 16 * k * (1 - p));
  const phoneRZ = useTransform([scrollYProgress, angle], ([p, k]) => 4 * k * (1 - p));
  const phoneY  = useTransform([scrollYProgress, angle], ([p, k]) => (k === 0 ? 0 : -40 * p));

  // Tilt mengikuti kursor (design.md 8.4), hanya untuk pointer presisi
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

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative w-full pt-6 pb-14 lg:-mr-14"
      style={{ perspective: 1400 }}
    >
      <motion.div className="relative" style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}>
        {/* Blok kuning jangkar visual di belakang iPad */}
        <div
          aria-hidden="true"
          className="hero-block-in absolute left-[6%] top-[16%] w-[80%] h-[90%] bg-brand-yellow border-2 border-brand-black rounded-[36px]"
        />

        {/* ===== iPad landscape ===== */}
        <div className="hero-tab-in relative z-[1] w-[92%] ml-[8%]" style={{ transformStyle: "preserve-3d" }}>
          <motion.div style={{ rotateY: tabRY, rotateX: tabRX, transformStyle: "preserve-3d" }}>
            <div className="hero-float-slow" style={{ filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.22))" }}>
              <div
                role="img"
                aria-label="Tampilan kasir KasirAI di iPad: grid produk dan keranjang belanja dengan total pembayaran"
                className="relative aspect-[1.43/1] bg-[#1B1C1F] p-[3.1%] box-border"
                style={{ borderRadius: "4.2% / 6%", boxShadow: "inset 0 0 0 1.5px #3A3B40, inset 0 0 0 4px #121316" }}
              >
                {/* Kamera depan + tombol atas/volume */}
                <span className="absolute top-[1.3%] left-1/2 -translate-x-1/2 w-[0.9%] aspect-square rounded-full bg-[#2B2D33] shadow-[inset_0_0_0_1px_#45474F]" />
                <span className="absolute -top-[0.6%] right-[7%] w-[6%] h-[0.8%] bg-[#2A2B30] rounded-t-[3px]" />
                <span className="absolute -top-[0.6%] left-[10%] w-[4%] h-[0.8%] bg-[#2A2B30] rounded-t-[3px]" />
                <span className="absolute -top-[0.6%] left-[15.5%] w-[4%] h-[0.8%] bg-[#2A2B30] rounded-t-[3px]" />
                <div className="relative w-full h-full overflow-hidden [container-type:inline-size]" style={{ borderRadius: "1.6% / 2.3%" }}>
                  <KasirScreen />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ===== HP Android portrait ===== */}
        <div
          className="hero-phone-in absolute z-[2] -left-[2%] -bottom-[10%] w-[34%] sm:w-[27%]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.div style={{ rotateY: phoneRY, rotateZ: phoneRZ, y: phoneY, transformStyle: "preserve-3d" }}>
            <div className="hero-float" style={{ filter: "drop-shadow(0 24px 36px rgba(0,0,0,0.28))" }}>
              <div
                role="img"
                aria-label="Laporan penjualan KasirAI di HP Android: ringkasan pendapatan, grafik tren, dan produk terlaris"
                className="relative aspect-[9.6/20] bg-[#17181B] p-[4.2%] box-border"
                style={{ borderRadius: "15% / 7.2%", boxShadow: "inset 0 0 0 1.5px #3A3B40" }}
              >
                {/* Tombol samping */}
                <span className="absolute -right-[2.2%] top-[22%] w-[2.2%] h-[9%] bg-[#2A2B30] rounded-r-[3px]" />
                <span className="absolute -right-[2.2%] top-[34%] w-[2.2%] h-[6%] bg-[#2A2B30] rounded-r-[3px]" />
                <div className="relative w-full h-full overflow-hidden [container-type:inline-size]" style={{ borderRadius: "12% / 5.6%" }}>
                  {/* Kamera punch-hole */}
                  <span className="absolute z-[2] top-[1.6%] left-1/2 -translate-x-1/2 w-[5.5%] aspect-square rounded-full bg-[#0E0F11]" />
                  <LaporanScreen />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
