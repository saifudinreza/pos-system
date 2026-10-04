// ============================================================
// theme.ts, Token desain neobrutalism KasirAI
// Sumber: frontend/tailwind.config.js. Semua komponen mengambil
// warna/font/shadow dari sini, jangan menulis hex langsung.
// ============================================================

import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const grotesk = loadGrotesk("normal", { weights: ["500", "700"] });
const mono = loadMono("normal", { weights: ["500", "700"] });

export const colors = {
  yellow: "#FFE500", // identitas utama
  black: "#0A0A0A", // teks, border, shadow
  cream: "#FFFBEB", // background utama
  gray: "#F5F5F0", // background section alternatif
  white: "#FFFFFF",
  green: "#00C27C",
  pink: "#FF7AB6",
  blue: "#0066FF",
  purple: "#8B5CF6",
  red: "#FF3B3B",
  orange: "#FF9F1C",
} as const;

export const fonts = {
  heading: `${grotesk.fontFamily}, "Space Grotesk", sans-serif`,
  mono: `${mono.fontFamily}, "JetBrains Mono", monospace`,
} as const;

// Shadow khas neobrutalism: offset saja, TANPA blur
export const shadow = {
  sm: `2px 2px 0 ${colors.black}`,
  md: `4px 4px 0 ${colors.black}`,
  lg: `8px 8px 0 ${colors.black}`,
  xl: `12px 12px 0 ${colors.black}`,
} as const;

export const border = `3px solid ${colors.black}`;
export const borderThin = `2px solid ${colors.black}`;

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;
