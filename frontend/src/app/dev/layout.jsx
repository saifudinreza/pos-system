"use client";

// ============================================================
// DevLayout, Kerangka halaman Developer Portal (khusus developer)
//
// Akses dikunci DUA lapis:
//   1. Role/email developer (DEV_EMAIL) → langsung lolos
//   2. Selain itu harus memasukkan PIN (NEXT_PUBLIC_DEV_PIN, fallback
//      demo), PIN yang benar disimpan ke sessionStorage agar tidak perlu
//      ulang selama sesi browser masih hidup
//
// Struktur: topbar (status + logout) + sidenav kiri (menu dev)
// + area konten {children}.
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import Link from "next/link";

// Developer-only layout, hanya email developer yang boleh akses
const DEV_EMAIL = "donojomi@gmail.com";

export default function DevLayout({ children }) {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const hydrateFromStorage = useAuthStore((s) => s.hydrateFromStorage);
  const [mounted, setMounted] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinVerified, setPinVerified] = useState(false);

  // Developer PIN (stored in env, fallback for demo)
  const DEV_PIN = process.env.NEXT_PUBLIC_DEV_PIN ?? "kasiradev2025";

  // Hydrate auth + cek apakah PIN sudah diverifikasi sesi ini
  useEffect(() => {
    hydrateFromStorage();
    setMounted(true);
    // Check if already verified this session
    const verified = sessionStorage.getItem("dev_verified");
    if (verified === "1") setPinVerified(true);
  }, [hydrateFromStorage]);

  /** handlePinSubmit, Validasi PIN; benar → tandai verified di session. */
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === DEV_PIN || user?.email === DEV_EMAIL) {
      sessionStorage.setItem("dev_verified", "1");
      setPinVerified(true);
    } else {
      alert("PIN salah. Hanya developer yang boleh mengakses halaman ini.");
    }
  };

  if (!mounted) return null;

  // Block non-developer email
  const isDevEmail = user?.email === DEV_EMAIL;
  if (!isDevEmail && !pinVerified) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4">
        <div
          className="bg-white border-2 border-brand-black w-full max-w-sm p-8"
          style={{ boxShadow: "6px 6px 0 #FFE500" }}
        >
          <div className="text-center mb-6">
            <div
              className="inline-block bg-brand-yellow border-2 border-brand-black px-4 py-2 mb-4"
              style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
            >
              <span className="font-black text-2xl"></span>
            </div>
            <h1 className="font-black text-xl font-grotesk">Developer Portal</h1>
            <p className="text-sm text-brand-black/50 mt-1">Akses terbatas untuk developer KasirAI</p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">Developer PIN</label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN developer..."
                autoFocus
                className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow font-mono"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-brand-yellow border-2 border-brand-black font-black text-sm hover:bg-yellow-300 transition-colors"
              style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
            >
              Masuk ke Developer Portal
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/dashboard" className="text-xs text-brand-black/40 hover:text-brand-black underline">
              ← Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black">
      {/* Dev Topbar */}
      <header
        className="bg-brand-yellow border-b-2 border-brand-black px-4 py-3 flex items-center justify-between sticky top-0 z-10"
        style={{ boxShadow: "0 2px 0 #0A0A0A" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="bg-brand-black text-brand-yellow px-3 py-1 text-xs font-black font-mono border-2 border-brand-black"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            DEV
          </div>
          <span className="font-black text-brand-black font-grotesk">KasirAI Developer Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-brand-black/60 hidden sm:block">{DEV_EMAIL}</span>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-brand-black border-2 border-brand-black px-3 py-1 hover:bg-brand-black hover:text-white transition-colors"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            ← Dashboard
          </Link>
          <button
            onClick={() => {
              sessionStorage.removeItem("dev_verified");
              setPinVerified(false);
              router.push("/dashboard");
            }}
            className="text-xs font-bold text-brand-black border-2 border-brand-black px-3 py-1 hover:bg-red-500 hover:text-white hover:border-red-600 transition-colors"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Dev Sidenav */}
      <div className="flex">
        <nav className="w-52 shrink-0 border-r-2 border-white/10 min-h-screen p-4 hidden md:block">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 font-mono">DEV MENU</p>
          <div className="space-y-1">
            {[
              { href: "/dev/subscriptions", label: " Subscriptions" },
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
