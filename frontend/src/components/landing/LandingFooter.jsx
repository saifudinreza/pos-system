// ============================================================
// LandingFooter — Footer bagian bawah landing page
//
// Analogi: Ini seperti bagian belakang kartu nama — berisi semua
// informasi penting (link, kontak, sosial media) yang tidak masuk
// ke bagian utama tapi tetap dibutuhkan pengunjung.
//
// Relasi: Diletakkan paling bawah di page.jsx, setelah CTASection.
// Tidak ada state — murni navigasi dan informasi statis.
// ============================================================

import Link from "next/link";

// Struktur link footer — dikelompokkan per kategori
// Analogi: seperti peta situs (sitemap) yang terorganisir
const FOOTER_LINKS = [
  {
    category: "Produk",
    links: [
      { label: "Fitur",       href: "#fitur" },
      { label: "Harga",       href: "#harga" },
      { label: "Demo",        href: "#cara-kerja" },
      { label: "Changelog",   href: "/changelog" },
    ],
  },
  {
    category: "Perusahaan",
    links: [
      { label: "Tentang Kami", href: "/about" },
      { label: "Blog",         href: "/blog" },
      { label: "Karir",        href: "/careers" },
      { label: "Press Kit",    href: "/press" },
    ],
  },
  {
    category: "Bantuan",
    links: [
      { label: "Dokumentasi",  href: "/docs" },
      { label: "Support",      href: "/support" },
      { label: "FAQ",          href: "/faq" },
      { label: "Status",       href: "/status" },
    ],
  },
  {
    category: "Legal",
    links: [
      { label: "Privasi",        href: "/privacy" },
      { label: "Ketentuan",      href: "/terms" },
      { label: "Cookie Policy",  href: "/cookies" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="bg-brand-black text-white border-t-3 border-brand-black">

      {/* === BAGIAN ATAS FOOTER: Logo + Tagline + Link === */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Kolom brand — lebih lebar dari kolom link */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 bg-brand-yellow border-2 border-white flex items-center justify-center font-black text-lg text-brand-black leading-none"
                style={{ boxShadow: "2px 2px 0 #FFE500" }}
              >
                K
              </div>
              <span className="font-black text-xl tracking-tight font-grotesk">
                KasirAI
              </span>
            </div>

            {/* Tagline singkat */}
            <p className="text-white/50 text-sm font-medium leading-relaxed max-w-xs mb-6">
              Platform POS + AI untuk bisnis Indonesia. Kasir cepat, laporan otomatis, AI siap membantu.
            </p>

            {/* Ikon sosial media */}
            {/* Analogi: pintu masuk ke berbagai "kanal komunikasi" toko */}
            <div className="flex gap-3">
              {[
                { label: "Instagram", icon: "📷" },
                { label: "Twitter/X", icon: "𝕏" },
                { label: "YouTube",   icon: "▶" },
                { label: "WhatsApp",  icon: "💬" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-9 h-9 bg-white/10 border border-white/20 flex items-center justify-center text-sm hover:bg-brand-yellow hover:text-brand-black hover:border-brand-yellow transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Kolom-kolom link navigasi */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.category} className="lg:col-span-1">
              <h4 className="font-black text-xs uppercase tracking-widest text-white/40 mb-4 font-mono">
                {group.category}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* === BAGIAN BAWAH FOOTER: Copyright + Status === */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-white/40 font-medium">
            © {new Date().getFullYear()} KasirAI. All rights reserved. Made in Indonesia 🇮🇩
          </p>

          {/* Status sistem — seperti indikator "buka/tutup" toko */}
          <div className="flex items-center gap-2 text-xs font-mono text-white/40">
            {/* Titik hijau berkedip = sistem online */}
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
