"use client";

// ============================================================
// motion.jsx — Helper animasi bersama untuk landing page
//
// Analogi: Ini seperti "kru panggung" yang mengatur kapan tiap
// elemen masuk frame saat penonton (user) menggulir layar.
//
// Semua komponen di sini MENGHORMATI prefers-reduced-motion:
// kalau user mematikan animasi di OS-nya, kita hanya pakai
// fade halus (tanpa geser/spring) supaya tetap nyaman & aksesibel.
// ============================================================

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Easing khas neobrutalist — tegas tapi tetap halus
const EASE = [0.22, 0.61, 0.36, 1];

// ------------------------------------------------------------
// Reveal — bungkus apa saja agar fade + slide-up saat masuk viewport
// ------------------------------------------------------------
export function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 26,
  x = 0,
  once = true,
  className,
  style,
  ...rest
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  return (
    <Tag
      className={className}
      style={style}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, x }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, x: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ------------------------------------------------------------
// Parallax — geser elemen mengikuti scroll (kecepatan berbeda
// dari konten utama) untuk kesan kedalaman antar-section.
//   speed > 0  → elemen "tertinggal" (bergerak ke atas saat scroll)
// Dimatikan otomatis saat reduced-motion.
// ------------------------------------------------------------
export function Parallax({
  children,
  speed = 0.3,
  as = "div",
  className,
  style,
  ...rest
}) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const range = speed * 120;
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [range, -range]
  );
  const Tag = motion[as] || motion.div;

  return (
    <Tag ref={ref} className={className} style={{ ...style, y }} {...rest}>
      {children}
    </Tag>
  );
}

// ------------------------------------------------------------
// Stagger — container yang memunculkan anak-anaknya berurutan
// Pakai bareng <StaggerItem> di dalamnya.
// ------------------------------------------------------------
export function Stagger({
  children,
  as = "div",
  gap = 0.1,
  once = true,
  className,
  style,
  ...rest
}) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, as = "div", y = 24, className, style, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      style={style}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EASE },
        },
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Re-export agar komponen lain bisa pakai util Framer Motion dari satu pintu
export {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
