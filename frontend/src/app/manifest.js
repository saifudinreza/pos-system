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
