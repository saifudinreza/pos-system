"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Banknote, Receipt, Package, Users,
  AlertTriangle, TrendingUp, MonitorCheck, Plus, CheckCircle2,
} from "lucide-react";
import StatCard         from "@/components/dashboard/StatCard";
import SalesChart       from "@/components/dashboard/SalesChart";
import TopProductsChart from "@/components/dashboard/TopProductsChart";
import NeoCard          from "@/components/ui/NeoCard";
import NeoButton            from "@/components/ui/NeoButton";
import NeoBadge             from "@/components/ui/NeoBadge";
import reportService        from "@/services/reportService";
import orderService         from "@/services/orderService";
import { formatCurrency, formatDateTime, getOrderStatusConfig } from "@/lib/utils";

export default function DashboardPage() {
  const [summary,      setSummary]      = useState(null);
  const [weekly,       setWeekly]       = useState([]);
  const [topProds,     setTopProds]     = useState([]);
  const [stock,        setStock]        = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [orders,       setOrders]       = useState([]);
  const [todayOrders,  setTodayOrders]  = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [salesRes, stockRes, ordersRes] = await Promise.allSettled([
          reportService.getSales({ period: "daily" }),
          reportService.getStock(),
          orderService.getAll({ per_page: 10, sort: "created_at", order: "desc" }),
        ]);

        if (salesRes.status === "fulfilled") {
          const d = salesRes.value;
          setSummary(d?.summary ?? null);

          const chartData = d?.chart_data ?? [];
          // Ambil 7 hari terakhir dari data bulan ini
          setWeekly(chartData.slice(-7));

          // Hitung order hari ini dari chart data
          const todayStr = new Date().toISOString().split("T")[0];
          const todayEntry = chartData.find((c) => c.period === todayStr);
          setTodayOrders(todayEntry?.total_transactions ?? 0);

          // Top 5 produk (fix key: total_quantity bukan total_qty)
          const tp = d?.top_products ?? [];
          setTopProds(
            tp.slice(0, 5).map((p) => ({
              name: p.name ?? "",
              qty:  p.total_quantity ?? 0,
            }))
          );

        }

        if (stockRes.status === "fulfilled") {
          const raw          = stockRes.value?.data ?? {};
          const stockProducts = raw.products ?? stockRes.value?.data ?? [];
          setStock(stockProducts.filter((p) => p.is_low_stock));
          setStockSummary(raw.summary ?? null);
        }

        if (ordersRes.status === "fulfilled") {
          setOrders(ordersRes.value?.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const SkeletonBar = () => <div className="h-8 skeleton w-full" />;

  return (
    <div className="space-y-6 page-fade">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-black font-grotesk">Dashboard</h2>
          <p className="text-sm text-brand-black/50 font-medium mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/products">
            <NeoButton size="sm" variant="primary">
              <Plus size={14} className="inline mr-1" />Produk
            </NeoButton>
          </Link>
          <Link href="/reports">
            <NeoButton size="sm" variant="secondary">
              <TrendingUp size={14} className="inline mr-1" />Laporan
            </NeoButton>
          </Link>
          <Link href="/kasir">
            <NeoButton size="sm" variant="dark">
              <MonitorCheck size={14} className="inline mr-1" />Kasir
            </NeoButton>
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
            <AlertTriangle
              size={20}
              className="text-brand-black shrink-0"
              style={{ animation: "wob 1.4s ease-in-out infinite" }}
            />
            <div>
              <p className="font-black text-brand-black text-sm">
                {stock.length} produk hampir habis stok!
              </p>
              <p className="text-xs text-brand-black/60">
                Segera lakukan restock untuk menghindari kehabisan produk.
              </p>
            </div>
          </div>
          <Link href="/products?low_stock=true">
            <NeoButton size="sm" variant="dark">Lihat Stok →</NeoButton>
          </Link>
        </div>
      )}

      {/* ── 4 Stat Cards (sesuai PRD: Revenue/Orders/Stok/Customer) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        {/* Card 1: Revenue Bulan Ini — kuning */}
        <div className="slide-up stagger-1 h-full">
          <StatCard
            label="Pendapatan Bulan Ini"
            value={loading ? "—" : formatCurrency(summary?.total_revenue ?? 0)}
            icon={<Banknote size={22} strokeWidth={2.5} />}
            color="yellow"
            trend={summary?.revenue_trend ?? undefined}
          />
        </div>

        {/* Card 2: Order Hari Ini — hitam */}
        <div className="slide-up stagger-2 h-full">
          <StatCard
            label="Order Hari Ini"
            value={loading ? "—" : todayOrders}
            icon={<Receipt size={22} strokeWidth={2.5} />}
            color="black"
            sub="transaksi"
          />
        </div>

        {/* Card 3: Stok Kritis — oranye (atau putih kalau aman) */}
        <div className="slide-up stagger-3 h-full">
          <StatCard
            label="Stok Hampir Habis"
            value={loading ? "—" : stock.length}
            icon={<Package size={22} strokeWidth={2.5} />}
            color={stock.length > 0 ? "orange" : "white"}
            sub={stock.length > 0 ? "perlu restock" : "semua aman"}
          />
        </div>

        {/* Card 4: Total Customer (pembeli unik bulan ini) — hijau */}
        <div className="slide-up stagger-4 h-full">
          <StatCard
            label="Total Customer"
            value={loading ? "—" : (summary?.total_customers ?? 0)}
            icon={<Users size={22} strokeWidth={2.5} />}
            color="green"
            sub="pembeli bulan ini"
          />
        </div>
      </div>

      {/* ── 3 Charts Row (sesuai PRD: Line + Bar + Donut) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Chart 1: Penjualan 7 Hari (Line) */}
        <NeoCard noPad className="slide-up stagger-1">
          <div className="px-5 py-4 border-b-2 border-brand-black">
            <h3 className="font-black text-sm font-grotesk">Penjualan 7 Hari</h3>
            <p className="text-xs text-brand-black/40">Tren pendapatan mingguan</p>
          </div>
          <div className="px-3 py-4">
            {loading
              ? <div className="h-[220px] skeleton" />
              : <SalesChart data={weekly} />
            }
          </div>
        </NeoCard>

        {/* Chart 2: Top 5 Produk Terlaris (Bar) */}
        <NeoCard noPad className="slide-up stagger-2">
          <div className="px-5 py-4 border-b-2 border-brand-black">
            <h3 className="font-black text-sm font-grotesk">Top 5 Produk</h3>
            <p className="text-xs text-brand-black/40">Terlaris bulan ini</p>
          </div>
          <div className="px-3 py-4">
            {loading
              ? <div className="h-[220px] skeleton" />
              : <TopProductsChart data={topProds} />
            }
          </div>
        </NeoCard>

        {/* Card 3: Kondisi Stok */}
        <NeoCard noPad className="slide-up stagger-3">
          <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm font-grotesk">Kondisi Stok</h3>
              <p className="text-xs text-brand-black/40">Ringkasan inventori terkini</p>
            </div>
            <Package size={16} className="text-brand-black/30" />
          </div>
          <div className="px-4 py-4 space-y-3">
            {loading ? (
              <div className="h-[200px] skeleton" />
            ) : (
              <>
                {[
                  {
                    label: "Total Produk",
                    value: stockSummary?.total_products ?? (stock.length + " (menipis)"),
                    cls:   "bg-brand-cream border-brand-black/20",
                    icon:  <Package size={15} className="text-brand-black/50" />,
                  },
                  {
                    label: "Stok Menipis",
                    value: stockSummary?.low_stock_count ?? stock.length,
                    cls:   (stockSummary?.low_stock_count ?? stock.length) > 0
                      ? "bg-orange-50 border-orange-400"
                      : "bg-green-50 border-green-400",
                    icon:  <AlertTriangle size={15} className={
                      (stockSummary?.low_stock_count ?? stock.length) > 0
                        ? "text-orange-500" : "text-green-500"
                    } />,
                  },
                  {
                    label: "Stok Habis",
                    value: stockSummary?.out_of_stock_count ?? 0,
                    cls:   (stockSummary?.out_of_stock_count ?? 0) > 0
                      ? "bg-red-50 border-red-400"
                      : "bg-green-50 border-green-400",
                    icon:  (stockSummary?.out_of_stock_count ?? 0) > 0
                      ? <AlertTriangle size={15} className="text-red-500" />
                      : <CheckCircle2 size={15} className="text-green-500" />,
                  },
                ].map(({ label, value, cls, icon }) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-4 py-3 border-2 rounded-md ${cls}`}
                    style={{ boxShadow: "2px 2px 0 #0A0A0A33" }}
                  >
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-sm font-bold">{label}</span>
                    </div>
                    <span className="font-black text-lg font-mono">{value}</span>
                  </div>
                ))}
                <Link href="/products?low_stock=true" className="block mt-1">
                  <div className="text-center text-xs font-bold text-brand-black/40 hover:text-brand-black underline underline-offset-2 transition-colors">
                    Lihat semua produk →
                  </div>
                </Link>
              </>
            )}
          </div>
        </NeoCard>
      </div>

      {/* ── Bottom Row: Recent Transactions + Low Stock ── */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Tabel Transaksi Terbaru */}
        <NeoCard noPad className="slide-up stagger-1">
          <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base font-grotesk">Transaksi Terbaru</h3>
            <Link
              href="/orders"
              className="text-xs font-bold text-brand-black/50 hover:text-brand-black underline underline-offset-2"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => <SkeletonBar key={i} />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center text-sm text-brand-black/40">Belum ada order</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-brand-black bg-brand-cream">
                    <th className="px-4 py-2.5 text-left text-xs font-black text-brand-black/60 uppercase tracking-wider">
                      No. Order
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-black text-brand-black/60 uppercase tracking-wider hidden sm:table-cell">
                      Waktu
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-black text-brand-black/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-black text-brand-black/60 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-black/10">
                  {orders.map((order) => {
                    const status = getOrderStatusConfig(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-brand-yellow/10 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-bold text-brand-black hover:underline underline-offset-2 font-mono text-xs"
                          >
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-brand-black/50 hidden sm:table-cell">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <NeoBadge
                            color={
                              order.status === "paid"      ? "green"  :
                              order.status === "cancelled" ? "red"    : "yellow"
                            }
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

        {/* Stok Hampir Habis */}
        <NeoCard noPad className="slide-up stagger-2">
          <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base font-grotesk">Stok Hampir Habis</h3>
            <Link
              href="/products?low_stock=true"
              className="text-xs font-bold text-brand-black/50 hover:text-brand-black underline underline-offset-2"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="divide-y divide-brand-black/10">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => <SkeletonBar key={i} />)}
              </div>
            ) : stock.length === 0 ? (
              <div className="py-10 text-center text-sm text-green-600 font-semibold">
                ✓ Semua stok aman
              </div>
            ) : (
              stock.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="px-5 py-3 flex items-center justify-between hover:bg-brand-yellow/10 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-brand-black truncate">{p.name}</p>
                    <p className="text-xs text-brand-black/40 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p
                      className={`font-black text-sm font-mono ${
                        p.stock === 0 ? "text-red-600" :
                        p.stock <= 5  ? "text-red-500" : "text-orange-500"
                      }`}
                    >
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

      {/* ── Quick Actions ── */}
      <NeoCard className="slide-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-black text-sm font-grotesk">Aksi Cepat</p>
            <p className="text-xs text-brand-black/40 mt-0.5">Pintasan ke fitur utama</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/products/new">
              <NeoButton size="sm" variant="primary">
                <Plus size={14} />Tambah Produk
              </NeoButton>
            </Link>
            <Link href="/reports">
              <NeoButton size="sm" variant="secondary">
                <TrendingUp size={14} />Lihat Laporan
              </NeoButton>
            </Link>
            <Link href="/kasir">
              <NeoButton size="sm" variant="dark">
                <MonitorCheck size={14} />Buka Kasir
              </NeoButton>
            </Link>
            <Link href="/users">
              <NeoButton size="sm" variant="ghost">
                <Users size={14} />Kelola User
              </NeoButton>
            </Link>
          </div>
        </div>
      </NeoCard>

    </div>
  );
}
