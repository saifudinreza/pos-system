"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import LogoMark from "@/components/brand/LogoMark";

export default function KasirLayout({ children }) {
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const { user, logout }   = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrateFromStorage();
    setMounted(true);
  }, [hydrateFromStorage]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
    {/* Catatan: Midtrans Snap JS TIDAK di-load di sini — dimuat on-demand oleh
        loadMidtransSnap() di kasir/page.jsx dengan data-client-key milik tenant,
        supaya tidak double-load dengan script inject manual. */}
    <div className="flex flex-col h-screen bg-brand-cream overflow-hidden">
      {/* Kasir Navbar — minimal, no sidebar */}
      <header className="h-14 bg-brand-black text-white flex items-center justify-between px-4 border-b-2 border-brand-black shrink-0 z-10">
        <div className="flex items-center gap-3">
          <LogoMark size={32} />
          <span className="font-black font-grotesk text-white">KasirAI</span>
          <span
            className="hidden sm:inline-block text-[10px] font-black font-mono bg-brand-yellow text-brand-black border border-brand-black px-2 py-0.5"
          >
            MODE KASIR
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Current time */}
          <span className="text-white/50 text-xs font-mono hidden md:block" suppressHydrationWarning>
            {mounted ? new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
          </span>

          {/* User info */}
          <span className="text-white/70 text-xs font-semibold hidden sm:block" suppressHydrationWarning>
            {mounted ? user?.name : ""}
          </span>

          {/* Back to dashboard */}
          <Link
            href="/dashboard"
            className="text-xs font-bold px-3 py-1.5 border-2 border-white/20 text-white hover:bg-white/10 transition-colors"
          >
            ← Dashboard
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-xs font-bold px-3 py-1.5 border-2 border-white/20 text-white/70 hover:bg-red-500/20 hover:text-white hover:border-red-400 transition-colors"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
    </>
  );
}
