import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sikasirai.com";

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "KasirAI — Kasir yang Ngerti Bisnis Kamu",
    template: "%s | KasirAI",
  },
  description:
    "Kasir POS + AI Assistant yang jawab pertanyaan bisnismu — \"produk apa paling laku?\" langsung dijawab AI. Kelola stok, transaksi, pajak otomatis, & laporan PDF/Excel. QRIS, kartu, transfer. Coba gratis 14 hari, tanpa kartu kredit.",
  keywords: [
    "pos system", "kasir online", "software kasir", "manajemen stok",
    "laporan penjualan", "AI assistant", "kasir pintar", "point of sale",
    "toko online", "manajemen toko", "KasirAI",
  ],
  authors: [{ name: "KasirAI Team" }],
  creator: "KasirAI",
  publisher: "KasirAI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: APP_URL,
    siteName: "KasirAI",
    title: "KasirAI — Kasir yang Ngerti Bisnis Kamu",
    description:
      "Tanya \"produk apa paling laku bulan ini?\" — AI Assistant KasirAI langsung jawab. Kelola stok, transaksi, pajak otomatis, & laporan PDF/Excel dalam satu platform. Coba gratis 14 hari.",
    // ↑ Gambar og:image di-generate otomatis oleh app/opengraph-image.js, tidak perlu didaftarkan manual di sini
  },
  twitter: {
    card: "summary_large_image",
    title: "KasirAI — Kasir yang Ngerti Bisnis Kamu",
    description: "AI Assistant jawab \"produk apa paling laku?\" dalam hitungan detik. Kelola stok, kasir, laporan otomatis. Coba gratis 14 hari!",
    creator: "@kasiraai",
  },
  alternates: {
    canonical: APP_URL,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? "",
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "KasirAI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Platform POS (Point of Sale) berbasis AI untuk manajemen kasir, stok, dan laporan bisnis.",
    url: APP_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IDR",
      description: "Gratis 14 hari, tidak perlu kartu kredit",
    },
  };

  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#FFE500" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-brand-cream text-brand-black">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
