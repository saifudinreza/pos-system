"use client";

// ============================================================
// Dashboard Layout — Bingkai semua halaman dalam area dashboard
//
// Analogi: seperti "denah kantor" — setiap halaman dashboard
// punya ruangan yang sama: sidebar di kiri, navbar di atas,
// konten utama di tengah, dan AI assistant di kanan.
//
// Relasi:
//   Layout → Sidebar (navigasi kiri)
//   Layout → Navbar  (header atas)
//   Layout → AISidebar (panel AI kanan, bisa dibuka/tutup)
//   Layout → children (konten halaman saat ini: dashboard, products, dll)
//
// Note: 'use client' diperlukan karena layout ini mengelola
// state sidebar (buka/tutup) menggunakan useState
// ============================================================

import { useState } from "react";
import Sidebar    from "@/components/layout/Sidebar";
import Navbar     from "@/components/layout/Navbar";
import AISidebar  from "@/components/layout/AISidebar";

export default function DashboardLayout({ children }) {
  // State sidebar kiri — buka/tutup di mobile
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  // State panel AI — buka/tutup di semua layar
  const [aiPanelOpen, setAiPanelOpen]   = useState(false);

  return (
    // Bingkai utama: flex row — sidebar | konten | ai-panel
    <div className="flex h-screen bg-brand-gray overflow-hidden">

      {/* === SIDEBAR KIRI === */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* === KOLOM TENGAH: Navbar + Konten === */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Navbar atas */}
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />

        {/* Area konten utama — scrollable */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* === AI SIDEBAR KANAN (toggle) ===
          Tombol buka/tutup AI — floating button di pojok */}
      <button
        onClick={() => setAiPanelOpen(true)}
        className={`
          fixed bottom-6 right-6 z-20
          w-12 h-12 bg-brand-black text-brand-yellow border-2 border-brand-black
          font-black text-lg flex items-center justify-center
          hover:bg-gray-800 transition-colors
          ${aiPanelOpen ? "xl:hidden" : ""}
        `}
        style={{ boxShadow: "3px 3px 0 #FFE500" }}
        title="Buka AI Assistant"
      >
        🤖
      </button>

      <AISidebar isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
    </div>
  );
}
