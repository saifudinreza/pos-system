/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Palet warna utama KasirAI — seperti cat tembok toko yang konsisten
        brand: {
          yellow: "#FFE500",   // Kuning mencolok → identitas utama brand
          black:  "#0A0A0A",   // Hitam pekat → teks dan border
          cream:  "#FFFBEB",   // Krem hangat → background utama
          gray:   "#F5F5F0",   // Abu terang → background section alternatif
        },
      },
      fontFamily: {
        // Space Grotesk: font tebal & modern untuk heading
        grotesk: ['"Space Grotesk"', "sans-serif"],
        // JetBrains Mono: font monospace untuk angka/kode
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        // Shadow khas neobrutalist — seperti stiker yang ditempel miring di kertas
        // Tidak ada blur (0px), hanya offset → kesan 3D yang tegas dan grafis
        neo:          "4px 4px 0px #0A0A0A",
        "neo-lg":     "8px 8px 0px #0A0A0A",
        "neo-sm":     "2px 2px 0px #0A0A0A",
        "neo-yellow": "4px 4px 0px #FFE500",
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
