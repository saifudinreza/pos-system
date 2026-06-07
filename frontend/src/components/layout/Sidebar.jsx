"use client";

// ============================================================
// Sidebar.jsx — Menu navigasi kiri
// Role-based: admin, kasir, user, developer
// developer = akses semua + menu /dev/subscriptions + /users
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/stores/authStore";
import {
  LayoutDashboard, // icon dashboard
  MonitorCheck,    // icon kasir
  Package,         // icon produk
  Tag,             // icon kategori
  ClipboardList,   // icon pesanan
  CreditCard,      // icon transaksi / subscription
  TrendingUp,      // icon laporan
  Users,           // icon pengguna
  UserCircle,      // icon profil
  BrainCircuit,    // icon AI monitoring
  Building2,       // icon tenant
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "kasir", "developer"] },
      { href: "/kasir",     Icon: MonitorCheck,    label: "Kasir",     roles: ["admin", "kasir", "developer"] },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { href: "/products",     Icon: Package,       label: "Produk",    roles: ["admin", "kasir", "developer"] },
      { href: "/categories",   Icon: Tag,           label: "Kategori",  roles: ["admin", "kasir", "developer"] },
      { href: "/orders",       Icon: ClipboardList, label: "Pesanan",   roles: ["admin", "kasir", "developer"] },
      { href: "/transactions", Icon: CreditCard,    label: "Transaksi", roles: ["admin", "kasir", "developer"] },
    ],
  },
  {
    label: "Laporan & Admin",
    items: [
      { href: "/reports",        Icon: TrendingUp,   label: "Laporan",        roles: ["admin", "developer"] },
      { href: "/ai-monitoring", Icon: BrainCircuit, label: "AI Monitoring",   roles: ["admin", "developer"] },
      { href: "/users",          Icon: Users,        label: "Pengguna",        roles: ["developer"] },
    ],
  },
  {
    label: "Akun",
    items: [
      { href: "/profile", Icon: UserCircle, label: "Profil & Langganan", roles: ["admin", "kasir", "user", "developer"] },
    ],
  },
];

// ============================================================
// NavItem — Satu baris menu di sidebar
//
// Props:
//   href     : URL tujuan
//   Icon     : komponen icon dari Lucide React
//   label    : teks label menu
//   isActive : apakah halaman ini sedang aktif?
//   badge    : text badge opsional (contoh: "DEV")
// ============================================================
const NavItem = ({ href, Icon, label, isActive, badge }) => (
  <Link
    href={href}
    className={`
      flex items-center gap-3 px-3 py-2.5 font-semibold text-sm
      border-2 transition-all duration-100
      ${isActive
        // Aktif: background kuning + border hitam + shadow neobrutalism
        ? "bg-brand-yellow border-brand-black"
        // Tidak aktif: transparan, hover efek kuning muda
        : "border-transparent text-brand-black/70 hover:bg-brand-yellow/30 hover:border-brand-black/30"
      }
    `}
    // Shadow hanya untuk item aktif (efek neobrutalism)
    style={isActive ? { boxShadow: "2px 2px 0 #0A0A0A" } : undefined}
  >
    {/* Icon dari Lucide React — size 16px, stroke lebih tebal (2.5) */}
    <Icon size={16} className="shrink-0" strokeWidth={2.5} />
    {/* Label teks — flex-1 agar mengisi ruang, truncate untuk teks panjang */}
    <span className="flex-1 truncate">{label}</span>
    {/* Badge opsional — contoh: "DEV" untuk menu developer */}
    {badge && (
      <span className="text-[9px] font-black bg-brand-black text-white px-1.5 py-0.5 font-mono shrink-0">
        {badge}
      </span>
    )}
    {/* Panah → hanya di item aktif sebagai visual indicator */}
    {isActive && <span className="ml-auto font-black text-xs shrink-0">→</span>}
  </Link>
);

export default function Sidebar({ isOpen, onClose }) {
  // usePathname() → string URL saat ini, misal "/dashboard" atau "/products"
  // Dipakai untuk menandai menu mana yang "aktif" (sedang dibuka)
  const pathname = usePathname();

  // Ambil user dari global state (Zustand authStore)
  // Selector (s) => s.user supaya komponen hanya re-render kalau s.user berubah
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "kasir";
  const plan = user?.subscription_plan ?? "free";

  // mounted: mencegah hydration mismatch
  // Saat Next.js render di server, localStorage tidak tersedia
  // sehingga user bisa jadi null. Setelah mount di browser, user sudah terisi.
  // Kita sembunyikan menu sampai mounted=true agar tidak ada "flash"
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isDevUser = mounted && role === "developer";

  return (
    <>
      {/* ── Overlay (backdrop) untuk mobile ──
          Hanya muncul di mobile saat sidebar terbuka (isOpen=true).
          Klik overlay → tutup sidebar.
          lg:hidden = sembunyikan di desktop (tidak perlu overlay di desktop)
      ── */}
      {isOpen && (
        <div className="fixed inset-0 bg-brand-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* ── Panel sidebar ──
          POSISI:
          - Mobile: fixed (nempel ke viewport), slide dari kiri
            - translate-x-0 saat isOpen=true (terlihat)
            - -translate-x-full saat isOpen=false (tersembunyi di luar layar)
          - Desktop (lg+): static (ikut flow dokumen, selalu terlihat)
            lg:translate-x-0 = override, tidak pernah tersembunyi di desktop
      ── */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-full lg:h-auto
          w-60 bg-brand-cream border-r-2 border-brand-black
          flex flex-col z-40 transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >

        {/* ── Logo + tombol tutup (mobile) ── */}
        <div className="px-4 py-4 border-b-2 border-brand-black flex items-center justify-between shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-brand-yellow border-2 border-brand-black flex items-center justify-center font-black text-sm"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              K
            </div>
            <span className="font-black text-lg font-grotesk">KasirAI</span>
          </Link>
          {/* Tombol ✕ hanya di mobile (lg:hidden) */}
          <button onClick={onClose} className="lg:hidden text-xl font-black hover:text-red-500 transition-colors">✕</button>
        </div>

        {/* ── Area navigasi ──
            overflow-y-auto: bisa di-scroll kalau menu banyak
            space-y-4: jarak antar group menu
        ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin">

          {/* Render grup menu berdasarkan NAV_GROUPS
              mounted check: pastikan sudah di browser sebelum render
              (karena effectiveRole bergantung pada localStorage via authStore)
          */}
          {mounted && NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) =>
              item.roles.includes(role)
            );

            // Kalau tidak ada item yang visible → sembunyikan seluruh group
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                {/* Label group — huruf kecil uppercase, warna abu muda */}
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-black/30 mb-1.5 px-3 font-mono">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavItem
                      key={item.href}
                      {...item}
                      // isActive: cek apakah pathname saat ini cocok dengan href menu
                      // pathname.startsWith(href + "/") untuk handle sub-halaman
                      // contoh: /orders/5 → menu "Pesanan" (/orders) tetap aktif
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* ── Section Developer — hanya role "developer" ── */}
          {isDevUser && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-red-400/60 mb-1.5 px-3 font-mono">
                Developer
              </p>
              <div className="space-y-0.5">
                <NavItem
                  href="/dev/subscriptions"
                  Icon={CreditCard}
                  label="Subscriptions"
                  badge="DEV"
                  isActive={pathname === "/dev/subscriptions"}
                />
                <NavItem
                  href="/dev/tenants"
                  Icon={Building2}
                  label="Manage Tenant"
                  badge="DEV"
                  isActive={pathname.startsWith("/dev/tenants")}
                />
              </div>
            </div>
          )}
        </nav>

        {/* ── User card — klik untuk ke halaman profil ── */}
        <Link
          href="/profile"
          className="block px-3 py-3 border-t-2 border-brand-black bg-white hover:bg-brand-yellow/20 transition-colors shrink-0 group"
          suppressHydrationWarning
        >
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div
              className="w-10 h-10 bg-brand-yellow border-2 border-brand-black flex items-center justify-center font-black text-sm shrink-0"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              suppressHydrationWarning
            >
              {mounted ? (user?.name?.[0]?.toUpperCase() ?? "?") : "?"}
            </div>

            <div className="min-w-0 flex-1" suppressHydrationWarning>
              {/* Nama */}
              <p className="font-bold text-sm text-brand-black truncate leading-tight">
                {mounted ? (user?.name ?? "User") : "User"}
              </p>
              {/* Email */}
              <p className="text-[10px] text-brand-black/40 font-mono truncate leading-tight mt-0.5">
                {mounted ? (user?.email ?? "") : ""}
              </p>
              {/* Badges: role + plan */}
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {mounted && isDevUser ? (
                  <span className="text-[8px] bg-brand-black text-brand-yellow px-1.5 py-0.5 font-black font-mono">DEVELOPER</span>
                ) : mounted ? (
                  <>
                    <span className="text-[8px] bg-brand-black/10 text-brand-black px-1.5 py-0.5 font-black font-mono capitalize border border-brand-black/20">
                      {role}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 font-black font-mono uppercase border ${
                      plan === "enterprise" ? "bg-brand-black text-white border-brand-black"
                      : plan === "pro"      ? "bg-brand-yellow text-brand-black border-brand-black"
                      :                       "bg-white text-brand-black/40 border-brand-black/20"
                    }`}>
                      {plan === "free" ? "FREE" : plan}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            {/* Arrow */}
            <span className="text-brand-black/20 group-hover:text-brand-black/50 transition-colors text-xs shrink-0">→</span>
          </div>
        </Link>
      </aside>
    </>
  );
}
