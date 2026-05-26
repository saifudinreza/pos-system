"use client";

import { useState, useEffect } from "react";
import Sidebar    from "@/components/layout/Sidebar";
import Navbar     from "@/components/layout/Navbar";
import AISidebar  from "@/components/layout/AISidebar";
import useAuthStore from "@/stores/authStore";

export default function DashboardLayout({ children }) {
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const canAccessAI        = useAuthStore((s) => s.canAccessAI);
  const isDeveloper        = useAuthStore((s) => s.isDeveloper);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => {
    hydrateFromStorage();
    setMounted(true);
  }, [hydrateFromStorage]);

  // canAccessAI() and isDeveloper() are functions — call them after mounted
  const showAI = mounted && canAccessAI();
  const isDev  = mounted && isDeveloper();

  return (
    <div className="flex h-screen bg-brand-gray overflow-hidden">

      {/* ── Sidebar kiri ── */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Kolom tengah: Navbar + konten ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 scrollbar-thin">
          {children}
        </main>
      </div>

      {/* ── AI Sidebar kanan ──
          Visible di lg (1024px+) sebagai panel tetap.
          Di bawah lg → floating button + slide-over.
          Syarat tampil: role admin OR developer email OR plan pro/enterprise.
      ── */}
      {showAI && (
        <>
          {/* Floating toggle — hanya muncul di < lg */}
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
            {aiPanelOpen ? "✕" : "🤖"}
          </button>

          {/* Desktop: selalu visible (lg+) */}
          <div className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0">
            <AISidebar isOpen={true} onClose={() => {}} alwaysVisible isDev={isDev} />
          </div>

          {/* Mobile / tablet: slide-over */}
          <div className="lg:hidden">
            <AISidebar isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} isDev={isDev} />
          </div>
        </>
      )}
    </div>
  );
}
