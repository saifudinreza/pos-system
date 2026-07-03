"use client";

// ============================================================
// LandingNavbar — Navigasi utama di bagian atas halaman
//
// Analogi: Ini seperti papan nama + menu di depan pintu restoran.
// Pengunjung langsung tahu nama tempatnya, bisa lihat apa yang ada,
// dan langsung tahu di mana harus daftar atau login.
//
// Relasi: Dipakai oleh page.jsx (halaman landing), bukan oleh dashboard.
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import LogoMark from "@/components/brand/LogoMark";

// --- Logo komponen ---
// Analogi: Logo adalah "wajah" brand — kotak kuning dengan K, langsung dikenal
const Logo = () => (
  <Link href="/" className="flex items-center gap-3 group">
    {/* Ikon brand — identitas visual neobrutalist */}
    <LogoMark size={36} className="group-hover:-rotate-3 transition-transform" />
    {/* Nama brand di sebelah logo */}
    <span className="font-black text-xl text-brand-black tracking-tight font-grotesk">
      KasirAI
    </span>
  </Link>
);

// --- Daftar link navigasi ---
// Analogi: Seperti daftar menu di papan restoran — tiap item membawa ke bagian tertentu
const NAV_LINKS = [
  { label: "Masalah", href: "#masalah" },
  { label: "Fitur",   href: "#fitur" },
  { label: "AI",      href: "#ai" },
  { label: "Harga",   href: "#harga" },
];

export default function LandingNavbar() {
  // State untuk menu mobile (buka/tutup hamburger)
  // Analogi: seperti saklar lampu — true = nyala (menu terbuka), false = mati (menu tertutup)
  const [menuOpen, setMenuOpen] = useState(false);

  // State untuk efek scroll — navbar berubah saat halaman digulir
  // Analogi: seperti kaca depan toko yang jadi buram sedikit saat hujan (scroll)
  const [scrolled, setScrolled] = useState(false);

  // useEffect: "pendengar" yang aktif saat komponen terpasang di halaman
  // Analogi: seperti satpam yang terus memantau apakah pintu masuk ramai atau sepi
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    // Cleanup: hapus pendengar saat komponen dilepas (cegah memory leak)
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tutup menu saat salah satu link diklik (untuk mobile)
  const handleNavClick = () => setMenuOpen(false);

  return (
    // Navbar sticky: selalu muncul di atas walau halaman di-scroll
    // Analogi: seperti header surat resmi yang selalu kelihatan di setiap halaman
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-brand-cream border-b-2 border-brand-black"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* === LOGO === */}
          <Logo />

          {/* === MENU DESKTOP (sembunyikan di layar kecil) === */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-brand-black hover:text-brand-yellow transition-colors relative group"
              >
                {link.label}
                {/* Garis bawah kuning saat hover — efek underline animasi */}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-yellow group-hover:w-full transition-all duration-200" />
              </a>
            ))}
          </div>

          {/* === TOMBOL CTA DESKTOP === */}
          <div className="hidden md:flex items-center gap-3">
            {/* Tombol Masuk: outline biasa, seperti "pintu samping" */}
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold border-2 border-brand-black bg-transparent hover:bg-brand-black hover:text-white transition-colors"
            >
              Masuk
            </Link>
            {/* Tombol Coba Gratis: kuning mencolok, ini "pintu utama" yang disorot */}
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-bold bg-brand-yellow border-2 border-brand-black neo-hover"
              style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
            >
              Coba Gratis
            </Link>
          </div>

          {/* === TOMBOL HAMBURGER (hanya muncul di mobile) === */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {/* Tiga garis = ikon hamburger, berubah jadi X saat menu terbuka */}
            <span className={`block w-6 h-0.5 bg-brand-black transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-brand-black transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-brand-black transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* === MENU MOBILE (muncul saat hamburger diklik) ===
          Analogi: seperti laci yang terbuka dari bawah navbar */}
      {menuOpen && (
        <div className="md:hidden bg-brand-cream border-t-2 border-brand-black px-4 pb-6 pt-4">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className="text-base font-bold text-brand-black py-1 border-b border-brand-black/20"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/login"
                onClick={handleNavClick}
                className="text-center py-2.5 font-bold border-2 border-brand-black"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={handleNavClick}
                className="text-center py-2.5 font-bold bg-brand-yellow border-2 border-brand-black"
                style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
              >
                Coba Gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
