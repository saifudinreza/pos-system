"use client";

// ============================================================
// DevLayout, Kerangka halaman Developer Portal (khusus developer)
//
// Akses dijaga di SERVER: src/middleware.js memverifikasi peran ke backend
// (GET /me) untuk setiap permintaan /dev/*, dan semua endpoint API /dev/*
// dikunci role:developer. Tidak ada PIN dan tidak ada daftar email di sini.
// Layout ini hanya lapis kedua: kalau data user sudah termuat dan perannya
// bukan developer, user dialihkan ke /dashboard.
//
// Struktur: topbar (status + keluar) + sidenav kiri (menu dev)
// + area konten {children}.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";

export default function DevLayout({ children }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrateFromStorage();
    setMounted(true);
  }, [hydrateFromStorage]);

  // Cookie valid tapi data user belum ada di browser (mis. localStorage dibersihkan):
  // muat ulang dari backend supaya halaman tidak kosong selamanya
  useEffect(() => {
    if (mounted && !user) fetchCurrentUser();
  }, [mounted, user, fetchCurrentUser]);

  // Lapis kedua: user sudah termuat tapi bukan developer → keluar dari portal
  useEffect(() => {
    if (mounted && user && user.role !== "developer") router.replace("/dashboard");
  }, [mounted, user, router]);

  // Jangan render apa pun sebelum peran terkonfirmasi (hindari kedip konten dev)
  if (!mounted || user?.role !== "developer") return null;

  return (
    <div className="min-h-screen bg-brand-black">
      {/* Dev Topbar */}
      <header
        className="bg-brand-yellow border-b-2 border-brand-black px-4 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{ boxShadow: "0 2px 0 var(--ink)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="bg-brand-black text-brand-yellow px-3 py-1 text-xs font-black font-mono border-2 border-brand-black"
            style={{ boxShadow: "2px 2px 0 var(--ink)" }}
          >
            DEV
          </div>
          <span className="font-black text-brand-black font-grotesk">KasirAI Developer Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-brand-black/60 hidden sm:block">{user.email}</span>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-brand-black border-2 border-brand-black px-3 py-1 hover:bg-brand-black hover:text-white transition-colors"
            style={{ boxShadow: "2px 2px 0 var(--ink)" }}
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* Dev Sidenav */}
      <div className="flex">
        <nav className="w-52 shrink-0 border-r-2 border-white/10 min-h-screen p-4 hidden md:block">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 font-mono">DEV MENU</p>
          <div className="space-y-1">
            {[
              { href: "/dev/subscriptions", label: " Subscriptions" },
              { href: "/dev/design-system", label: " Design System" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors border-2 border-transparent hover:border-white/20"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
