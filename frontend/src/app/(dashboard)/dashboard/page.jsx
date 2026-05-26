"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard          from "@/components/dashboard/StatCard";
import SalesChart        from "@/components/dashboard/SalesChart";
import TopProductsChart  from "@/components/dashboard/TopProductsChart";
import NeoCard           from "@/components/ui/NeoCard";
import NeoButton         from "@/components/ui/NeoButton";
import NeoBadge          from "@/components/ui/NeoBadge";
import reportService     from "@/services/reportService";
import orderService      from "@/services/orderService";
import { formatCurrency, formatDateTime, getOrderStatusConfig } from "@/lib/utils";

export default function DashboardPage() {
  const [sales,    setSales]    = useState(null);
  const [weekly,   setWeekly]   = useState([]);
  const [topProds, setTopProds] = useState([]);
  const [stock,    setStock]    = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [salesRes, weeklyRes, stockRes, ordersRes] = await Promise.allSettled([
          reportService.getSales({ period: "daily" }),
          reportService.getSales({ period: "weekly" }),
          reportService.getStock(),
          orderService.getAll({ per_page: 10, sort: "created_at", order: "desc" }),
        ]);

        if (salesRes.status  === "fulfilled") setSales(salesRes.value?.summary ?? salesRes.value);
        if (weeklyRes.status === "fulfilled") {
          const wData = weeklyRes.value?.data ?? [];
          setWeekly(wData);
          // extract top products if available
          const tp = weeklyRes.value?.top_products ?? [];
          setTopProds(tp.slice(0, 5).map((p) => ({ name: p.name?.split(" ")[0] ?? p.name, qty: p.total_qty ?? p.quantity ?? 0 })));
        }
        if (stockRes.status  === "fulfilled") {
          setStock((stockRes.value?.data ?? []).filter((p) => p.is_low_stock));
        }
        if (ordersRes.status === "fulfilled") setOrders(ordersRes.value?.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const SkeletonBar = () => (
    <div className="h-8 skeleton w-full" />
  );

  return (
    <div className="space-y-6 page-fade">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-black font-grotesk">Dashboard</h2>
          <p className="text-sm text-brand-black/50 font-medium mt-0.5 capitalize">{today}</p>
        </div>
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Link href="/products">
            <NeoButton size="sm" variant="primary">+ Produk</NeoButton>
          </Link>
          <Link href="/reports">
            <NeoButton size="sm" variant="secondary">📈 Laporan</NeoButton>
          </Link>
          <Link href="/kasir">
            <NeoButton size="sm" variant="dark">🖥️ Kasir</NeoButton>
          </Link>
        </div>
      </div>

      {/* ── Low Stock Alert Banner ── */}
      {!loading && stock.length > 0 && (
        <div
          className="flex items-center justify-between gap-4 px-4 py-3 bg-brand-yellow border-2 border-brand-black slide-up"
          style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl" style={{ animation: "wob 1.4s ease-in-out infinite" }}>⚠️</span>
            <div>
              <p className="font-black text-brand-black text-sm">
                {stock.length} produk hampir habis stok!
              </p>
              <p className="text-xs text-brand-black/60">Segera lakukan restock untuk menghindari kehabisan produk.</p>
            </div>
          </div>
          <Link href="/products?low_stock=true">
            <NeoButton size="sm" variant="dark">Lihat Stok →</NeoButton>
          </Link>
        </div>
      )}

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="slide-up stagger-1">
          <StatCard
            label="Pendapatan Bulan Ini"
            value={loading ? "—" : formatCurrency(sales?.total_revenue ?? 0)}
            icon="💰" color="yellow"
            trend={sales?.revenue_trend ?? undefined}
          />
        </div>
        <div className="slide-up stagger-2">
          <StatCard
            label="Order Hari Ini"
            value={loading ? "—" : (sales?.total_orders ?? 0)}
            icon="🧾" color="white"
            sub="transaksi"
          />
        </div>
        <div className="slide-up stagger-3">
          <StatCard
            label="Stok Hampir Habis"
            value={loading ? "—" : stock.length}
            icon="📦"
            color={stock.length > 0 ? "yellow" : "white"}
            sub={stock.length > 0 ? "perlu restock" : "semua aman"}
          />
        </div>
        <div className="slide-up stagger-4">
          <StatCard
            label="Item Terjual"
            value={loading ? "—" : (sales?.total_items ?? 0)}
            icon="🏷️" color="white"
            sub="hari ini"
          />
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Sales Line Chart */}
        <NeoCard noPad className="slide-up stagger-1">
          <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm sm:text-base font-grotesk">Penjualan 7 Hari</h3>
              <p className="text-xs text-brand-black/40">Tren pendapatan mingguan</p>
            </div>
          </div>
          <div className="px-3 py-4">
            {loading
              ? <div className="h-[220px] flex items-center justify-center"><div className="skeleton h-full w-full" /></div>
              : <SalesChart data={weekly} />
            }
          </div>
        </NeoCard>

        {/* Top Products Bar Chart */}
        <NeoCard noPad className="slide-up stagger-2">
          <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm sm:text-base font-grotesk">Top 5 Produk</h3>
              <p className="text-xs text-brand-black/40">Paling banyak terjual</p>
            </div>
          </div>
          <div className="px-3 py-4">
            {loading
              ? <div className="h-[220px] flex items-center justify-center"><div className="skeleton h-full w-full" /></div>
              : <TopProductsChart data={topProds} />
            }
          </div>
        </NeoCard>
      </div>

      {/* ── Bottom Row: Recent Orders + Low Stock ── */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Recent Transactions Table */}
        <NeoCard noPad className="slide-up stagger-1">
          <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base font-grotesk">Transaksi Terbaru</h3>
            <Link href="/orders" className="text-xs font-bold text-brand-black/50 hover:text-brand-black underline underline-offset-2">
              Lihat semua →
            </Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map((i) => <SkeletonBar key={i} />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center text-sm text-brand-black/40">Belum ada order</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-brand-black bg-brand-cream">
                    <th className="px-4 py-2.5 text-left text-xs font-black text-brand-black/60 uppercase tracking-wider">No. Order</th>
                    <th className="px-4 py-2.5 text-left text-xs font-black text-brand-black/60 uppercase tracking-wider hidden sm:table-cell">Waktu</th>
                    <th className="px-4 py-2.5 text-left text-xs font-black text-brand-black/60 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-black text-brand-black/60 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-black/10">
                  {orders.map((order) => {
                    const status = getOrderStatusConfig(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-brand-yellow/10 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/orders/${order.id}`} className="font-bold text-brand-black hover:underline underline-offset-2 font-mono text-xs">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-brand-black/50 hidden sm:table-cell">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <NeoBadge
                            color={order.status === "paid" ? "green" : order.status === "cancelled" ? "red" : "yellow"}
                          >
                            {status.label}
                          </NeoBadge>
                        </td>
                        <td className="px-4 py-3 text-right font-black font-mono text-sm">
                          {formatCurrency(order.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </NeoCard>

        {/* Low Stock Products */}
        <NeoCard noPad className="slide-up stagger-2">
          <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base font-grotesk">Stok Hampir Habis</h3>
            <Link href="/products?low_stock=true" className="text-xs font-bold text-brand-black/50 hover:text-brand-black underline underline-offset-2">
              Lihat semua →
            </Link>
          </div>
          <div className="divide-y divide-brand-black/10">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map((i) => <SkeletonBar key={i} />)}
              </div>
            ) : stock.length === 0 ? (
              <div className="py-10 text-center text-sm text-green-600 font-semibold">
                ✓ Semua stok aman
              </div>
            ) : (
              stock.slice(0, 8).map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-brand-yellow/10 transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-brand-black truncate">{p.name}</p>
                    <p className="text-xs text-brand-black/40 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`font-black text-sm font-mono ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-red-500" : "text-orange-500"}`}>
                      {p.stock} sisa
                    </p>
                    <p className="text-[10px] text-brand-black/40">min. {p.stock_alert}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </NeoCard>
      </div>
    </div>
  );
}
