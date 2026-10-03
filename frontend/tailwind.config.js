/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Palet KasirAI. Nilainya ada di src/app/globals.css (:root) sebagai triplet RGB,
        // supaya modifier opacity (bg-brand-black/50) tetap bekerja.
        brand: {
          yellow: "rgb(var(--yellow-rgb) / <alpha-value>)", // identitas brand: CTA utama & penanda aktif
          black:  "rgb(var(--ink-rgb) / <alpha-value>)",    // teks, border, shadow
          cream:  "rgb(var(--cream-rgb) / <alpha-value>)",  // latar utama
          gray:   "rgb(var(--gray-rgb) / <alpha-value>)",   // latar section alternatif
        },
        // Warna SEMANTIK: pakai ini untuk makna, bukan hex / palet bawaan Tailwind
        success: "rgb(var(--success-rgb) / <alpha-value>)", // berhasil, lunas, aman
        danger:  "rgb(var(--danger-rgb) / <alpha-value>)",  // error, bahaya, hapus
        warning: "rgb(var(--warning-rgb) / <alpha-value>)", // peringatan, stok menipis
        info:    "rgb(var(--info-rgb) / <alpha-value>)",    // informasi netral
        accent:  "rgb(var(--accent-rgb) / <alpha-value>)",  // aksen sekunder (dekorasi, grafik)
        // Teks sekunder (60% ink). Contoh: text-ink-muted
        ink: { muted: "rgb(var(--ink-rgb) / 0.6)" },
      },
      // SKALA TIPOGRAFI: pakai ini, jangan text-4xl/text-5xl ad hoc untuk judul.
      //   display: judul hero/CTA besar · h1: judul halaman aplikasi · h2: judul section landing
      //   h3: judul kartu besar · h4: judul kartu kecil · body/small/caption: teks isi
      fontSize: {
        display: ["clamp(2.25rem, 1.2rem + 3.4vw, 3.375rem)", { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "900" }],
        h1:      ["clamp(1.5rem, 1.1rem + 1.4vw, 2rem)",       { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "900" }],
        h2:      ["clamp(2rem, 1.2rem + 2.6vw, 3rem)",         { lineHeight: "1.1",  letterSpacing: "-0.015em", fontWeight: "900" }],
        h3:      ["1.5rem",   { lineHeight: "1.2", fontWeight: "900" }],
        h4:      ["1.125rem", { lineHeight: "1.3", fontWeight: "800" }],
        body:    ["1rem",     { lineHeight: "1.6" }],
        small:   ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem",  { lineHeight: "1.4" }],
      },
      fontFamily: {
        // Space Grotesk: font tebal & modern untuk heading
        grotesk: ['"Space Grotesk"', "sans-serif"],
        // JetBrains Mono: font monospace untuk angka/kode
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        // Shadow khas neobrutalist, seperti stiker yang ditempel miring di kertas
        // Tidak ada blur (0px), hanya offset → kesan 3D yang tegas dan grafis
        neo:          "4px 4px 0px var(--ink)",
        "neo-lg":     "8px 8px 0px var(--ink)",
        "neo-sm":     "2px 2px 0px var(--ink)",
        "neo-yellow": "4px 4px 0px var(--yellow)",
      },
      borderWidth: {
        3: "3px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        slideIn: {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: ".4" },
        },
      },
      animation: {
        float:   "float 3s ease-in-out infinite",
        slideIn: "slideIn 0.2s ease-out",
        fadeIn:  "fadeIn 0.25s ease-out both",
        shimmer: "shimmer 1.5s infinite linear",
        pulse2:  "pulse2 2s ease-in-out infinite",
      },
      transitionTimingFunction: {
        neo: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};
