import "./globals.css";
import Script from "next/script";

// Metadata: informasi halaman yang dibaca oleh browser & mesin pencari (SEO)
// Analogi: seperti kartu nama toko — nama, deskripsi, dan identitas di satu tempat
export const metadata = {
  title: "KasirAI — POS + AI Assistant",
  description:
    "Kasir pintar dengan AI. Kelola penjualan, stok, dan laporan dalam satu platform terintegrasi. Coba gratis 14 hari.",
};

// RootLayout: "bingkai" yang membungkus SEMUA halaman di aplikasi ini
// Analogi: seperti bangunan toko — semua area (kasir, gudang, kantor) ada di dalam bangunan yang sama
// children = konten dari setiap halaman yang berbeda-beda
export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased bg-brand-cream text-brand-black">
        {children}
        {/* Midtrans Snap JS — diperlukan untuk window.snap.pay() di halaman kasir.
            strategy="lazyOnload" agar tidak memblokir render halaman awal. */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
