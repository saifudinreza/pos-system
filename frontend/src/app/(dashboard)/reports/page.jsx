"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import reportService, { triggerFileDownload } from "@/services/reportService";
import StatCard  from "@/components/dashboard/StatCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoCard   from "@/components/ui/NeoCard";
import NeoTable  from "@/components/ui/NeoTable";
import { formatCurrency, formatDate } from "@/lib/utils";

const ChartTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border-2 border-brand-black px-3 py-2" style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
      <p className="text-xs font-black mb-1">{label}</p>
      <p className="text-sm font-black font-mono">
        {currency ? formatCurrency(payload[0]?.value ?? 0) : (payload[0]?.value ?? 0) + " item"}
      </p>
    </div>
  );
};

export default function ReportsPage() {
  const [period,  setPeriod]  = useState("monthly");
  const [year,    setYear]    = useState(new Date().getFullYear());
  const [sales,   setSales]   = useState(null);
  const [stock,   setStock]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState("sales");
  const [denied,  setDenied]  = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      setSales(await reportService.getSales({ period, year }));
      setDenied(false);
    } catch (err) {
      if (err.response?.status === 403) setDenied(true);
    } finally { setLoading(false); }
  };

  const fetchStock = async () => {
    setLoading(true);
    try {
      setStock((await reportService.getStock()).data ?? []);
      setDenied(false);
    } catch (err) {
      if (err.response?.status === 403) setDenied(true);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === "sales") fetchSales();
    else fetchStock();
  }, [tab, period, year]);

  const handleDownload = async (format = "pdf") => {
    try {
      const res = tab === "sales"
        ? await reportService.downloadSales({ period, year, format })
        : await reportService.downloadStock({ format });
      triggerFileDownload(res, `laporan-${tab}-${Date.now()}.${format}`);
    } catch { alert("Gagal mengunduh laporan"); }
  };

  const salesColumns = [
    { key: "label",   label: "Periode" },
    { key: "revenue", label: "Pendapatan", render: (v) => <span className="font-mono font-bold">{formatCurrency(v)}</span> },
    { key: "orders",  label: "Order",      render: (v) => <span className="font-mono">{v ?? 0}</span> },
    { key: "items",   label: "Item",       render: (v) => <span className="font-mono">{v ?? 0}</span> },
  ];

  const stockColumns = [
    { key: "name",         label: "Produk" },
    { key: "sku",          label: "SKU",       render: (v) => <span className="font-mono text-xs text-brand-black/60">{v}</span> },
    { key: "stock",        label: "Stok",      render: (v, r) => <span className={`font-mono font-black ${r.is_low_stock ? "text-red-600" : "text-green-700"}`}>{v}</span> },
    { key: "stock_alert",  label: "Min. Stok", render: (v) => <span className="font-mono text-brand-black/50">{v}</span> },
    { key: "price",        label: "Nilai Stok", render: (v, r) => <span className="font-mono font-bold">{formatCurrency((r.stock ?? 0) * (v ?? 0))}</span> },
    { key: "is_low_stock", label: "Status",    render: (v) => <span className={`text-xs font-black ${v ? "text-red-600" : "text-green-600"}`}>{v ? "⚠️ Rendah" : "✓ Aman"}</span> },
  ];

  const chartData = sales?.data ?? [];
  const topData   = (sales?.top_products ?? []).slice(0, 10).map((p) => ({ name: p.name?.split(" ")[0] ?? p.name, qty: p.total_qty ?? 0 }));

  if (denied) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-16 h-16 bg-red-50 border-3 border-red-400 flex items-center justify-center text-3xl" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>🔒</div>
      <div className="text-center">
        <h3 className="font-black text-lg">Akses Ditolak</h3>
        <p className="text-sm text-brand-black/50 mt-1">Halaman ini hanya bisa diakses oleh <strong>Admin</strong>.</p>
        <p className="text-xs text-brand-black/40 mt-2 font-mono">Role kamu saat ini bukan admin. Hubungi admin untuk mengubah role.</p>
      </div>
      <div className="bg-brand-cream border-2 border-brand-black p-4 text-xs font-mono max-w-sm" style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
        <p className="font-black mb-1">Cara fix (jalankan di terminal backend):</p>
        <code className="text-brand-black/70 break-all">php artisan tinker<br />User::where(&apos;email&apos;,&apos;YOUR_EMAIL&apos;)-&gt;update([&apos;role&apos;=&gt;&apos;admin&apos;])</code>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl page-fade">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-grotesk">Laporan</h2>
          <p className="text-sm text-brand-black/50">Analisis penjualan &amp; kondisi stok</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <NeoButton variant="secondary" size="sm" onClick={() => handleDownload("pdf")}>
            ↓ PDF
          </NeoButton>
          <NeoButton variant="dark" size="sm" onClick={() => handleDownload("excel")}>
            ↓ Excel
          </NeoButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-brand-black">
        {[
          { key: "sales", label: "📈 Penjualan" },
          { key: "stock", label: "📦 Stok" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 font-bold text-sm border-b-2 -mb-0.5 transition-colors
              ${tab === t.key ? "border-brand-black bg-brand-yellow" : "border-transparent hover:bg-brand-yellow/20"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sales Tab */}
      {tab === "sales" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              <option value="monthly">Bulanan</option>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
            </select>
            {period === "monthly" && (
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="2020" max="2099"
                className="w-24 px-3 py-2 text-sm border-2 border-brand-black outline-none font-mono"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              />
            )}
          </div>

          {/* Summary cards */}
          {sales?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Pendapatan" value={formatCurrency(sales.summary.total_revenue)} icon="💰" color="yellow" />
              <StatCard label="Total Order"       value={sales.summary.total_orders ?? 0}             icon="🧾" />
              <StatCard label="Item Terjual"      value={sales.summary.total_items ?? 0}              icon="📦" />
              <StatCard label="Rata-rata Order"   value={formatCurrency(sales.summary.avg_order ?? 0)} icon="📊" />
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <NeoCard noPad>
              <div className="px-5 py-4 border-b-2 border-brand-black">
                <h3 className="font-black text-sm font-grotesk">Tren Penjualan</h3>
              </div>
              <div className="px-3 py-4">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="0" stroke="#0A0A0A" strokeOpacity={0.06} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={{ stroke: "#0A0A0A", strokeWidth: 2 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
                    <Tooltip content={<ChartTooltip currency />} />
                    <Line type="monotone" dataKey="revenue" stroke="#FFE500" strokeWidth={3} dot={{ r: 4, fill: "#FFE500", stroke: "#0A0A0A", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </NeoCard>
          )}

          {/* Top products chart */}
          {topData.length > 0 && (
            <NeoCard noPad>
              <div className="px-5 py-4 border-b-2 border-brand-black">
                <h3 className="font-black text-sm font-grotesk">Top 10 Produk Terlaris</h3>
              </div>
              <div className="px-3 py-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topData} margin={{ top: 5, right: 15, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="0" stroke="#0A0A0A" strokeOpacity={0.06} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} axisLine={{ stroke: "#0A0A0A", strokeWidth: 2 }} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#FFE500", fillOpacity: 0.15 }} />
                    <Bar dataKey="qty" fill="#FFE500" stroke="#0A0A0A" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </NeoCard>
          )}

          <NeoTable columns={salesColumns} data={chartData} isLoading={loading} emptyText="Belum ada data penjualan" />
        </>
      )}

      {/* Stock Tab */}
      {tab === "stock" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Total Produk"  value={stock.length}                                               icon="📦" />
            <StatCard label="Stok Rendah"   value={stock.filter((p) => p.is_low_stock).length}                icon="⚠️" color={stock.filter((p) => p.is_low_stock).length > 0 ? "yellow" : "white"} />
            <StatCard label="Nilai Total"   value={formatCurrency(stock.reduce((s, p) => s + (p.stock ?? 0) * (p.price ?? 0), 0))} icon="💰" color="yellow" />
          </div>
          <NeoTable columns={stockColumns} data={stock} isLoading={loading} emptyText="Belum ada data stok" />
        </>
      )}
    </div>
  );
}
