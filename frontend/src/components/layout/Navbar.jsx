"use client";

// ============================================================
// Navbar (Dashboard) — Bar atas halaman dashboard
// Analogi: seperti "resepsionis" di pintu ruang kerja —
// tahu siapa yang sedang login, ada tombol logout, dan bisa
// buka/tutup sidebar di mobile.
// ============================================================

import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";

export default function Navbar({ onMenuToggle, pageTitle = "Dashboard" }) {
  const router   = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-white border-b-2 border-brand-black flex items-center justify-between px-4 shrink-0">
      {/* Kiri: Tombol hamburger (mobile) + judul halaman */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 border-2 border-brand-black flex items-center justify-center"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          ☰
        </button>
        <h1 className="font-black text-lg text-brand-black font-grotesk hidden sm:block">
          {pageTitle}
        </h1>
      </div>

      {/* Kanan: Info user + tombol logout */}
      <div className="flex items-center gap-3">
        {/* Badge role */}
        <span className="hidden sm:inline-block bg-brand-yellow border-2 border-brand-black px-2 py-0.5 text-[10px] font-black uppercase font-mono">
          {user?.role ?? ""}
        </span>

        {/* Nama user */}
        <span className="text-sm font-bold text-brand-black hidden md:block truncate max-w-[120px]">
          {user?.name ?? ""}
        </span>

        {/* Tombol logout */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-xs font-bold border-2 border-brand-black bg-white hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-colors"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
