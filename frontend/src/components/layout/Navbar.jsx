"use client";

// ============================================================
// Navbar, bar atas halaman dashboard
//
// Sengaja ramping (audit desain, issue #10): judul halaman, nama,
// peran, dan paket TIDAK diulang di sini karena sudah ada di judul
// halaman dan kartu akun di sidebar. Yang tersisa: tombol menu (mobile),
// logo (mobile), ajakan upgrade untuk paket Free, dan tombol Keluar.
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import LogoMark from "@/components/brand/LogoMark";
import { trackEvent } from "@/lib/analytics";
import { LogOut, Menu, Sparkles } from "lucide-react";

export default function Navbar({ onMenuToggle }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const isDev  = user?.role === "developer";
  const plan   = user?.effective_plan ?? user?.subscription_plan ?? "free";
  // Ajakan upgrade hanya untuk pemilik/admin paket Free (kasir tidak bisa membayar langganan)
  const canUpgrade = !isDev && plan === "free" && user?.role !== "kasir";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-white border-b-2 border-brand-black flex items-center justify-between px-4 shrink-0 z-10">
      {/* Kiri: menu + logo hanya di mobile (di desktop sidebar sudah memuat logo) */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 border-2 border-brand-black flex items-center justify-center bg-white hover:bg-brand-yellow transition-all duration-150 shrink-0 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          aria-label="Buka menu"
        >
          <Menu size={16} strokeWidth={2.5} className="text-brand-black" />
        </button>
        <div className="lg:hidden flex items-center gap-2 min-w-0">
          <LogoMark size={26} />
          <span className="font-black text-base font-grotesk">KasirAI</span>
        </div>
      </div>

      {/* Kanan */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {canUpgrade && (
          <Link
            href="/upgrade?plan=pro"
            onClick={() => trackEvent("cta_click", { posisi: "navbar_app", tujuan: "upgrade" })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-brand-yellow border-2 border-brand-black hover:bg-yellow-300 transition-colors"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            <Sparkles size={13} strokeWidth={2.5} />
            <span>Upgrade ke Pro</span>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-brand-black bg-white hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-all duration-150 whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          <LogOut size={13} strokeWidth={2.5} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
