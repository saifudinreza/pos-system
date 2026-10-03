// ============================================================
// LegalPage, kerangka halaman hukum (Kebijakan Privasi, Syarat & Ketentuan)
// Header sederhana + judul + isi bersusun + footer landing.
// Isi dikirim sebagai children; gunakan <LegalSection> per pasal.
// ============================================================

import Link from "next/link";
import LogoMark from "@/components/brand/LogoMark";
import LandingFooter from "@/components/landing/LandingFooter";

/** Satu pasal: judul bernomor + isi (paragraf / daftar). */
export function LegalSection({ n, title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-grotesk font-black text-2xl text-brand-black mb-3">
        {n}. {title}
      </h2>
      <div className="space-y-3 text-brand-black/75 font-medium leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

/**
 * LegalPage
 * Props: title, updated (teks tanggal), intro (opsional), children
 */
export default function LegalPage({ title, updated, intro, children }) {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <header className="border-b-3 border-brand-black bg-brand-yellow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark size={36} />
            <span className="font-black text-xl font-grotesk">KasirAI</span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-white border-2 border-brand-black font-bold text-sm focus-visible:outline focus-visible:outline-4 focus-visible:outline-brand-black"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            ← Kembali
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-grotesk font-black text-4xl sm:text-5xl text-brand-black tracking-tight mb-2">
          {title}
        </h1>
        <p className="font-mono text-sm text-brand-black/50 mb-8">Terakhir diperbarui: {updated}</p>
        {intro && <p className="text-lg font-medium text-brand-black/75 leading-relaxed mb-10">{intro}</p>}
        {children}
      </main>

      <LandingFooter />
    </div>
  );
}
