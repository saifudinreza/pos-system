// ============================================================
// manifest.js — Web App Manifest (PWA) untuk KasirAI
//
// Next.js file convention: menghasilkan /manifest.webmanifest
// yang dipakai browser saat user "Add to Home Screen".
// Warna mengikuti brand: cream (#FFFBEB) + yellow (#FFE500).
//
// ⚠️ Icon di sini (web-app-manifest-*.png) juga harus masuk
// exclusion matcher middleware.js — sudah ada di daftar.
// ============================================================

export default function manifest() {
  return {
    name: "KasirAI — Kasir yang Ngerti Bisnis Kamu",
    short_name: "KasirAI",
    description:
      "Kasir POS + AI Assistant untuk kelola penjualan, stok, dan laporan bisnis.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFBEB",
    theme_color: "#FFE500",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
