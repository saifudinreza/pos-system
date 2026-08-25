// ============================================================
// not-found.jsx, Halaman 404 (URL tidak ditemukan)
//
// Analogi: "ruang tunggu" gedung, user yang nyasar ke halaman
// yang tidak ada diarahkan ke sini, lengkap dengan tombol
// kembali ke beranda. Desain neobrutal sesuai design system.
// ============================================================

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="text-center">
        <div
          className="inline-block bg-brand-yellow border-3 border-brand-black px-6 py-4 mb-6"
          style={{ boxShadow: "6px 6px 0 #0A0A0A" }}
        >
          <p className="font-black text-6xl font-mono">404</p>
        </div>
        <h1 className="text-2xl font-black font-grotesk mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-brand-black/50 font-medium mb-6">Halaman yang kamu cari tidak ada atau telah dipindahkan.</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-brand-black text-white font-bold border-2 border-brand-black"
          style={{ boxShadow: "3px 3px 0 #FFE500" }}
        >
          ← Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
