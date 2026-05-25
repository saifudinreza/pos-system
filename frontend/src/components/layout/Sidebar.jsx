"use client";

// ============================================================
// Sidebar — Navigasi utama dashboard
// Analogi: seperti "peta koridor" di kantor —
// menunjukkan semua ruangan (halaman) yang bisa dikunjungi
// sesuai jabatan (role) karyawan yang login.
//
// Relasi: dibaca oleh DashboardLayout, menggunakan useAuthStore
// untuk cek role agar menu yang ditampilkan sesuai hak akses.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/stores/authStore";

// Daftar menu navigasi — dikelompokkan per bagian
// Analogi: seperti papan petunjuk di kantor — per lantai/divisi
const NAV_GROUPS = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", icon: "📊", label: "Dashboard",   roles: ["admin", "kasir"] },
      { href: "/kasir",     icon: "🖥️", label: "Kasir",      roles: ["admin", "kasir"] },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { href: "/products",    icon: "📦", label: "Produk",     roles: ["admin", "kasir"] },
      { href: "/categories",  icon: "🏷️", label: "Kategori",  roles: ["admin"] },
      { href: "/orders",      icon: "🧾", label: "Pesanan",    roles: ["admin", "kasir"] },
      { href: "/transactions",icon: "💳", label: "Transaksi",  roles: ["admin", "kasir"] },
    ],
  },
  {
    label: "Laporan & Admin",
    items: [
      { href: "/reports", icon: "📈", label: "Laporan", roles: ["admin", "kasir"] },
      { href: "/users",   icon: "👥", label: "Pengguna", roles: ["admin"] },
    ],
  },
];

// --- NavItem: satu item menu di sidebar ---
const NavItem = ({ href, icon, label, isActive }) => (
  <Link
    href={href}
    className={`
      flex items-center gap-3 px-3 py-2.5 font-semibold text-sm
      border-2 transition-all duration-100
      ${isActive
        ? "bg-brand-yellow border-brand-black"
        : "border-transparent text-brand-black/70 hover:bg-brand-yellow/30 hover:border-brand-black/30"
      }
    `}
    style={isActive ? { boxShadow: "2px 2px 0 #0A0A0A" } : undefined}
  >
    <span className="text-base w-5 text-center">{icon}</span>
    <span>{label}</span>
    {isActive && <span className="ml-auto font-black text-xs">→</span>}
  </Link>
);

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const user     = useAuthStore((s) => s.user);
  const role     = user?.role ?? "kasir";

  return (
    <>
      {/* Overlay mobile — klik di luar sidebar untuk tutup */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-brand-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-full lg:h-auto
          w-64 bg-brand-cream border-r-2 border-brand-black
          flex flex-col z-40 transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo di atas sidebar */}
        <div className="px-4 py-5 border-b-2 border-brand-black flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-brand-yellow border-2 border-brand-black flex items-center justify-center font-black"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              K
            </div>
            <span className="font-black text-lg font-grotesk">KasirAI</span>
          </Link>
          {/* Tombol tutup di mobile */}
          <button onClick={onClose} className="lg:hidden text-xl font-black">✕</button>
        </div>

        {/* Navigasi — scrollable kalau banyak item */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV_GROUPS.map((group) => {
            // Filter menu sesuai role user yang login
            const visibleItems = group.items.filter((item) => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                {/* Label grup — seperti divider antar bagian */}
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/40 mb-2 px-3 font-mono">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavItem
                      key={item.href}
                      {...item}
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Info user di bawah sidebar */}
        <div className="px-4 py-4 border-t-2 border-brand-black bg-white">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 bg-brand-yellow border-2 border-brand-black flex items-center justify-center font-black text-sm shrink-0"
              style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
            >
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-brand-black truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-brand-black/50 font-mono capitalize">{role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
