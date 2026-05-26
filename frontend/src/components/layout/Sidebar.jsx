"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/stores/authStore";

const DEV_EMAIL = "donojomi@gmail.com";

const NAV_GROUPS = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", icon: "📊", label: "Dashboard",  roles: ["admin", "kasir"] },
      { href: "/kasir",     icon: "🖥️", label: "Kasir",     roles: ["admin", "kasir"] },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { href: "/products",     icon: "📦", label: "Produk",    roles: ["admin", "kasir"] },
      { href: "/categories",   icon: "🏷️", label: "Kategori", roles: ["admin"] },
      { href: "/orders",       icon: "🧾", label: "Pesanan",   roles: ["admin", "kasir"] },
      { href: "/transactions", icon: "💳", label: "Transaksi", roles: ["admin", "kasir"] },
    ],
  },
  {
    label: "Laporan & Admin",
    items: [
      { href: "/reports", icon: "📈", label: "Laporan",  roles: ["admin", "kasir"] },
      { href: "/users",   icon: "👥", label: "Pengguna", roles: ["admin"] },
    ],
  },
];

const NavItem = ({ href, icon, label, isActive, badge }) => (
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
    <span className="text-base w-5 text-center shrink-0">{icon}</span>
    <span className="flex-1 truncate">{label}</span>
    {badge && (
      <span className="text-[9px] font-black bg-brand-black text-white px-1.5 py-0.5 font-mono shrink-0">
        {badge}
      </span>
    )}
    {isActive && <span className="ml-auto font-black text-xs shrink-0">→</span>}
  </Link>
);

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const user     = useAuthStore((s) => s.user);
  const role     = user?.role ?? "kasir";
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isDevUser    = mounted && user?.email === DEV_EMAIL;
  // Developer always gets admin-level access on the sidebar
  const effectiveRole = isDevUser ? "admin" : role;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-brand-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed lg:static top-0 left-0 h-full lg:h-auto
          w-60 bg-brand-cream border-r-2 border-brand-black
          flex flex-col z-40 transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
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
          <button onClick={onClose} className="lg:hidden text-xl font-black hover:text-red-500 transition-colors">✕</button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin">
          {mounted && NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => item.roles.includes(effectiveRole));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-black/30 mb-1.5 px-3 font-mono">
                  {group.label}
                </p>
                <div className="space-y-0.5">
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

          {/* Developer section — only for dev email */}
          {isDevUser && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-red-400/60 mb-1.5 px-3 font-mono">
                Developer
              </p>
              <div className="space-y-0.5">
                <NavItem
                  href="/dev/subscriptions"
                  icon="💳"
                  label="Subscriptions"
                  badge="DEV"
                  isActive={pathname.startsWith("/dev")}
                />
              </div>
            </div>
          )}
        </nav>

        {/* User info */}
        <div className="px-4 py-3 border-t-2 border-brand-black bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 bg-brand-yellow border-2 border-brand-black flex items-center justify-center font-black text-sm shrink-0"
              style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
              suppressHydrationWarning
            >
              {mounted ? (user?.name?.[0]?.toUpperCase() ?? "?") : "?"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-brand-black truncate" suppressHydrationWarning>
                {mounted ? (user?.name ?? "User") : "User"}
              </p>
              <div className="flex items-center gap-1.5" suppressHydrationWarning>
                {isDevUser ? (
                  <>
                    <span className="text-[8px] bg-brand-black text-brand-yellow px-1.5 py-0.5 font-black font-mono">DEVELOPER</span>
                    <span className="text-[8px] bg-brand-yellow text-brand-black px-1 py-0.5 font-black font-mono">ENTERPRISE</span>
                  </>
                ) : (
                  <p className="text-xs text-brand-black/50 font-mono capitalize">
                    {mounted ? role : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
