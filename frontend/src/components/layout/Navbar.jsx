"use client";

// ============================================================
// Navbar, bar atas halaman dashboard
//
// Neobrutalist style: border tebal, shadow kotak, animasi hover.
// ============================================================

import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import { LogOut, Menu } from "lucide-react";

const PAGE_TITLES = {
  "/dashboard":    "Dashboard",
  "/products":     "Produk",
  "/categories":   "Kategori",
  "/orders":       "Pesanan",
  "/transactions": "Transaksi",
  "/reports":      "Laporan",
  "/users":        "Pengguna",
  "/kasir":        "Kasir",
  "/profile":      "Profil & Langganan",
  "/upgrade":      "Upgrade Plan",
};

const PLAN_BADGE = {
  free:       { label: "FREE",       cls: "bg-white/80 text-brand-black/60 border-brand-black/20" },
  pro:        { label: "PRO",        cls: "bg-brand-yellow text-brand-black border-brand-black" },
  enterprise: { label: "ENTERPRISE", cls: "bg-brand-black text-white border-brand-black" },
  developer:  { label: "DEV",        cls: "bg-brand-yellow text-brand-black border-brand-black" },
};

const ROLE_COLORS = {
  admin:     "bg-brand-yellow text-brand-black border-brand-black",
  kasir:     "bg-brand-black text-white border-brand-black",
  user:      "bg-white text-brand-black border-brand-black",
  developer: "bg-brand-black text-brand-yellow border-brand-black",
};

export default function Navbar({ onMenuToggle }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const pageTitle    = PAGE_TITLES[pathname] ?? "KasirAI";
  const isDev        = user?.role === "developer";
  const effectivePlan = isDev ? "developer" : (user?.effective_plan ?? user?.subscription_plan ?? "free");
  const planBadge     = PLAN_BADGE[effectivePlan] ?? PLAN_BADGE.free;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-white border-b-2 border-brand-black flex items-center justify-between px-4 shrink-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — neobrutalist button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 border-2 border-brand-black flex items-center justify-center bg-white hover:bg-brand-yellow transition-all duration-150 shrink-0 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          aria-label="Buka menu"
        >
          <Menu size={16} strokeWidth={2.5} className="text-brand-black" />
        </button>

        <h1 className="font-black text-base sm:text-lg text-brand-black font-grotesk truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Plan badge */}
        <span
          suppressHydrationWarning
          className={`hidden sm:inline-flex items-center text-[10px] font-black border px-2 py-0.5 font-mono tracking-wider ${planBadge.cls}`}
        >
          {planBadge.label}
        </span>

        {/* Role badge */}
        <span
          suppressHydrationWarning
          className={`hidden sm:inline-flex items-center text-[10px] font-black border px-2 py-0.5 uppercase font-mono ${isDev ? ROLE_COLORS.developer : (ROLE_COLORS[user?.role] ?? ROLE_COLORS.user)}`}
        >
          {isDev ? "DEVELOPER" : (user?.role ?? "")}
        </span>

        {/* User name */}
        <span
          suppressHydrationWarning
          className="text-sm font-bold text-brand-black hidden md:block truncate max-w-[100px]"
        >
          {user?.name ?? ""}
        </span>

        {/* Logout — neobrutalist button with red hover */}
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
