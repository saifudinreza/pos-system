"use client";

// ============================================================
// LandingNavbar, Navigasi utama di bagian atas halaman
//
// Neobrutalist design: border tebal, shadow kotak, animasi hover.
// Sticky navbar dengan efek blur saat scroll.
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import LogoMark from "@/components/brand/LogoMark";

// --- Logo komponen ---
const Logo = () => (
  <Link href="/" className="flex items-center gap-3 group">
    <LogoMark
      size={36}
      className="group-hover:-rotate-6 group-hover:scale-110 transition-all duration-200"
    />
    <span className="font-black text-xl text-brand-black tracking-tight font-grotesk group-hover:tracking-normal transition-all duration-200">
      KasirAI
    </span>
  </Link>
);

// --- Daftar link navigasi ---
const NAV_LINKS = [
  { label: "Masalah", href: "#masalah" },
  { label: "Fitur",   href: "#fitur" },
  { label: "AI",      href: "#ai" },
  { label: "Harga",   href: "#harga" },
];

/**
 * LandingNavbar, navbar sticky landing page.
 * State: menuOpen (hamburger mobile), scrolled (efek blur saat scroll).
 */
export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 mx-4 mt-4 max-w-7xl lg:mx-auto border-2 border-brand-black rounded-2xl transition-all duration-300 ${
        scrolled
          ? "bg-brand-yellow/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
          : "bg-brand-yellow"
      }`}
    >
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* === LOGO === */}
          <Logo />

          {/* === MENU DESKTOP === */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-bold text-brand-black rounded-sm group"
              >
                <span className="relative z-10">{link.label}</span>
                {/* Hover background */}
                <span className="absolute inset-0 bg-brand-black/5 scale-0 group-hover:scale-100 transition-transform duration-200 origin-bottom rounded-sm" />
                {/* Underline slide */}
                <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-brand-black scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </a>
            ))}
          </div>

          {/* === TOMBOL CTA DESKTOP === */}
          <div className="hidden md:flex items-center gap-3">
            {/* Tombol Masuk — neo-brutalist style */}
            <Link
              href="/login"
              className="relative px-5 py-2 text-sm font-bold text-brand-black border-2 border-brand-black bg-white neo-btn rounded-md"
            >
              Masuk
            </Link>

            {/* Tombol Coba Gratis — shine + neo-hover */}
            <Link
              href="/register"
              className="btn-shine relative px-5 py-2 text-sm font-bold text-brand-black bg-brand-yellow border-2 border-brand-black neo-hover overflow-hidden rounded-md"
              style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
            >
              Coba Gratis
            </Link>
          </div>

          {/* === HAMBURGER === */}
          <button
            className="md:hidden relative w-10 h-10 flex items-center justify-center"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span
                className={`block h-0.5 bg-brand-black transition-all duration-300 origin-center ${
                  menuOpen ? "rotate-45 translate-y-[4px]" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-brand-black transition-all duration-200 ${
                  menuOpen ? "opacity-0 scale-x-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 bg-brand-black transition-all duration-300 origin-center ${
                  menuOpen ? "-rotate-45 -translate-y-[4px]" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* === MENU MOBILE === */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-brand-cream border-t-2 border-brand-black px-4 pb-6 pt-4 rounded-b-2xl">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className="text-base font-bold text-brand-black py-2.5 px-3 border-b border-brand-black/10 hover:bg-brand-yellow/50 transition-colors rounded-sm"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-3">
              <Link
                href="/login"
                onClick={handleNavClick}
                className="text-center py-2.5 font-bold border-2 border-brand-black bg-white neo-btn text-sm rounded-md"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={handleNavClick}
                className="btn-shine text-center py-2.5 font-bold bg-brand-yellow border-2 border-brand-black neo-hover text-sm overflow-hidden rounded-md"
                style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
              >
                Coba Gratis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
