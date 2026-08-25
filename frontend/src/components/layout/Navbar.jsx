"use client";

// ============================================================
// Navbar, bar atas halaman dashboard
//
// Isi: judul halaman (dipetakan dari pathname via PAGE_TITLES),
// badge plan & role user, nama user, dan tombol Keluar.
// Sumber data: authStore (Zustand). Badge plan menampilkan
// effective_plan, role developer selalu ditampilkan sebagai "DEV".
// ============================================================

import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/stores/authStore";

// Judul per halaman, key = pathname, dipakai sebagai heading navbar
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

// Badge plan, label + warna untuk tiap paket langganan
const PLAN_BADGE = {
  free:       { label: "FREE",       cls: "bg-white/80 text-brand-black/60 border-brand-black/20" },
  pro:        { label: "PRO",        cls: "bg-brand-yellow text-brand-black border-brand-black" },
  enterprise: { label: "ENTERPRISE", cls: "bg-brand-black text-white border-brand-black" },
  developer:  { label: "DEV",        cls: "bg-brand-yellow text-brand-black border-brand-black" },
};

// Warna badge role user, dipakai di samping badge plan
const ROLE_COLORS = {
  admin:     "bg-brand-yellow text-brand-black border-brand-black",
  kasir:     "bg-brand-black text-white border-brand-black",
  user:      "bg-white text-brand-black border-brand-black",
  developer: "bg-brand-black text-brand-yellow border-brand-black",
};

/**
 * Navbar, bar atas dashboard (lihat header file untuk deskripsi).
 *
 * Props:
 *   onMenuToggle : membuka sidebar di layar mobile (tombol hamburger )
 */
export default function Navbar({ onMenuToggle }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  // Judul halaman dari pathname saat ini; fallback nama brand
  const pageTitle    = PAGE_TITLES[pathname] ?? "KasirAI";
  const isDev        = user?.role === "developer";
  // Developer selalu tampil sebagai plan "developer"; selain itu pakai effective_plan
  const effectivePlan = isDev ? "developer" : (user?.effective_plan ?? user?.subscription_plan ?? "free");
  const planBadge     = PLAN_BADGE[effectivePlan] ?? PLAN_BADGE.free;

  // Logout lalu arahkan kembali ke halaman login
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-white border-b-2 border-brand-black flex items-center justify-between px-4 shrink-0 z-10">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 border-2 border-brand-black flex items-center justify-center hover:bg-brand-yellow transition-colors shrink-0"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          aria-label="Buka menu"
        >
          
        </button>
        <h1 className="font-black text-base sm:text-lg text-brand-black font-grotesk truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Subscription plan badge */}
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-xs font-bold border-2 border-brand-black bg-white hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-colors whitespace-nowrap"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
