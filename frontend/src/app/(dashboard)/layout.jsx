"use client";

// ============================================================
// DashboardLayout, Kerangka halaman dashboard
//
// Analogi: Ini seperti "bangunan kantor",
// terdiri dari 3 bagian tetap yang selalu ada di setiap halaman:
//   - Sidebar kiri  : menu navigasi
//   - Area tengah   : navbar atas + konten halaman (yang berganti-ganti)
//   - AI panel kanan: asisten AI (hanya untuk admin/pro/enterprise)
//
// Semua halaman di dalam folder (dashboard)/ secara otomatis
// dibungkus oleh layout ini. Ini adalah konsep Next.js 14 App Router:
//   src/app/(dashboard)/layout.jsx    → layout dibagi semua halaman dalam grup
//   src/app/(dashboard)/dashboard/page.jsx → konten halaman utama
//   src/app/(dashboard)/products/page.jsx  → konten halaman produk
//   ... dst
//
// Relasi:
//   - DashboardLayout → pakai useAuthStore untuk cek akses AI
//   - DashboardLayout → render Sidebar, Navbar, AISidebar
//   - {children}      → konten halaman aktif (berganti saat navigasi)
//
// Responsif:
//   - Mobile/tablet: sidebar tersembunyi (slide-over), AI panel toggle
//   - Desktop (lg+): sidebar tetap terlihat, AI panel selalu visible
// ============================================================

import { useState, useEffect } from "react";
import Sidebar    from "@/components/layout/Sidebar";
import Navbar     from "@/components/layout/Navbar";
import AISidebar  from "@/components/layout/AISidebar";
import useAuthStore from "@/stores/authStore";

export default function DashboardLayout({ children }) {
  // Ambil fungsi dari authStore menggunakan selector
  // Selector (s) => s.xxx mencegah re-render berlebihan,
  // komponen hanya re-render kalau nilai yang di-select berubah
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  // Select user directly so the layout re-renders whenever user changes
  // (e.g. after fetchCurrentUser() updates role/subscription_plan post-payment)
  const user = useAuthStore((s) => s.user);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrateFromStorage();
    setMounted(true);
  }, [hydrateFromStorage]);

  // ── Nilai turunan: plan & role menentukan fitur yang tampil ──
  const plan   = user?.effective_plan ?? user?.subscription_plan ?? "free";
  const role   = user?.role ?? "kasir";
  const showAI = mounted && (
    role === "developer" ||
    role === "admin" ||
    plan === "pro" ||
    plan === "enterprise"
  );
  const isDev = mounted && role === "developer";

  return (
    // flex h-screen: layout penuh tinggi layar, tidak scroll secara keseluruhan
    // overflow-hidden: scroll hanya terjadi di area konten tengah, bukan keseluruhan page
    <div className="flex h-screen bg-brand-gray overflow-hidden">

      {/* ── Sidebar kiri ──
          Di mobile: tersembunyi, muncul sebagai overlay saat sidebarOpen=true
          Di desktop (lg+): selalu terlihat di sisi kiri
      ── */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Kolom tengah: Navbar + konten halaman ──
          flex-1: ambil sisa ruang setelah sidebar dan AI panel
          min-w-0: mencegah overflow konten (penting di flex layout)
          overflow-hidden: konten yang panjang di-scroll di dalam <main>
      ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Navbar selalu di atas, tombol menu untuk toggle sidebar di mobile */}
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />

        {/* Area konten halaman, bisa di-scroll jika konten panjang
            {children} = konten dari page.jsx yang sedang aktif
            Ganti navigasi → children berganti, layout tetap */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 scrollbar-thin">
          {children}
        </main>
      </div>

      {/* ── AI Sidebar kanan ──
          Hanya ditampilkan jika user punya akses (showAI = true):
          - Role admin ATAU
          - Email developer (donojomi@gmail.com) ATAU
          - Subscription plan pro/enterprise

          Di lg+ (desktop): panel tetap di sebelah kanan (width 72 = 18rem)
          Di bawah lg      : floating button + slide-over dari kanan
      ── */}
      {showAI && (
        <>
          {/* Tombol floating di pojok kanan bawah, hanya muncul di mobile/tablet
              lg:hidden = sembunyikan di layar besar (desktop sudah ada panel tetap) */}
          <button
            onClick={() => setAiPanelOpen((v) => !v)}
            className="
              fixed bottom-5 right-5 z-30 w-12 h-12
              bg-brand-black text-brand-yellow border-2 border-brand-black
              font-black text-lg flex items-center justify-center
              transition-all duration-150 hover:bg-gray-900 active:scale-95
              lg:hidden
            "
            style={{ boxShadow: "3px 3px 0 #FFE500" }}
            aria-label="Buka AI Assistant"
          >
            {aiPanelOpen ? (
              <span className="text-base leading-none"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-brand-yellow"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l4.93-1.37A9.953 9.953 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                <circle cx="8.5"  cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="12"   cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="15.5" cy="12" r="1" fill="currentColor" stroke="none" />
              </svg>
            )}
          </button>

          {/* Desktop: panel AI selalu visible, ada di samping konten
              hidden lg:flex = sembunyikan di mobile, tampilkan di desktop */}
          <div className="hidden lg:flex lg:flex-col lg:w-96 lg:shrink-0">
            {/* alwaysVisible=true: panel tidak punya overlay/slide behavior */}
            <AISidebar isOpen={true} onClose={() => {}} alwaysVisible isDev={isDev} />
          </div>

          {/* Mobile/tablet: slide-over dari kanan (ada backdrop gelap di belakangnya)
              lg:hidden = sembunyikan di desktop (sudah ada yang atas) */}
          <div className="lg:hidden">
            <AISidebar isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} isDev={isDev} />
          </div>
        </>
      )}
    </div>
  );
}
