import "./globals.css";
import Script from "next/script";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kasirai.vercel.app";

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "KasirAI — POS + AI Assistant Cerdas",
    template: "%s | KasirAI",
  },
  description:
    "Kasir pintar berbasis AI. Kelola penjualan, stok, laporan, dan pelanggan dalam satu platform terintegrasi. Didukung Groq LLaMA. Coba gratis 14 hari.",
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
    title: "KasirAI — POS + AI Assistant Cerdas",
    description:
      "Kasir pintar berbasis AI. Kelola penjualan, stok, laporan dalam satu platform. Coba gratis 14 hari.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KasirAI — POS System dengan AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KasirAI — POS + AI Assistant Cerdas",
    description: "Kasir pintar berbasis AI. Kelola penjualan, stok, laporan. Coba gratis!",
    images: ["/og-image.png"],
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#FFE500" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-brand-cream text-brand-black">
        {children}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
