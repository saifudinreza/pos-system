"use client";

// ============================================================
// Reports Page — Laporan penjualan & stok + export PDF/Excel
//
// Data yang diambil (per tab):
//   - Tab "Penjualan": reportService.getSales(params) → summary
//     (revenue, orders, COGS, laba kotor, margin), chart_data,
//     top_products · params ditentukan preset: hari ini / 7 / 30 hari /
//     bulanan (dengan pilihan tahun) / custom (rentang tanggal)
//   - Tab "Stok": reportService.getStock() → daftar produk + ringkasan
//     stok (menipis, habis, nilai total)
//
// Export PDF/Excel hanya untuk paket Pro/Enterprise — backend juga
// memblokir (403) kalau Free; tombol disembunyikan via isFreePlan.
// File di-download via blob (triggerFileDownload dari reportService).
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Banknote, Receipt, Package, TrendingUp,
  AlertTriangle, ShoppingCart, Download, Calendar,
} from "lucide-react";
import reportService, { triggerFileDownload } from "@/services/reportService";
import useAuthStore from "@/stores/authStore";
import StatCard  from "@/components/dashboard/StatCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoCard   from "@/components/ui/NeoCard";
import NeoTable  from "@/components/ui/NeoTable";
import NeoBadge  from "@/components/ui/NeoBadge";
import { formatCurrency } from "@/lib/utils";

// ── Helpers ─────────────────────────────────────────────────────
// Format tanggal ke string YYYY-MM-DD (untuk query param date_from/date_to)
const fmtDate = (d) => d.toISOString().split("T")[0];
const todayStr = () => fmtDate(new Date());
// n hari kebelakang — +1 supaya "7 hari" berarti 7 entri termasuk hari ini
const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n + 1); return fmtDate(d); };

const PRESETS = [
  { id: "today",   label: "Hari Ini" },
  { id: "7d",      label: "7 Hari" },
  { id: "30d",     label: "30 Hari" },
  { id: "monthly", label: "Bulanan" },
  { id: "custom",  label: "Custom" },
];

// ── Tooltip ──────────────────────────────────────────────────────
/** ChartTooltip — Tooltip kustom untuk chart Recharts (neobrutal, konsisten dgn tema). */
const ChartTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border-2 border-brand-black px-3 py-2" style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
      <p className="text-xs font-black mb-1">{label}</p>
      <p className="text-sm font-black font-mono">
        {currency ? formatCurrency(payload[0]?.value ?? 0) : `${payload[0]?.value ?? 0} item`}
      </p>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────
export default function ReportsPage() {
  // ── State: tab aktif, preset periode, data, loading ──
  const [tab,          setTab]          = useState("sales");      // "sales" | "stock"
  const [preset,       setPreset]       = useState("monthly");    // preset periode penjualan
  const [filterYear,   setFilterYear]   = useState(new Date().getFullYear());
  const [customFrom,   setCustomFrom]   = useState("");           // rentang custom (preset "custom")
  const [customTo,     setCustomTo]     = useState("");
  const [sales,        setSales]        = useState(null);
  const [stock,        setStock]        = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [denied,       setDenied]       = useState(false);        // 403 → halaman akses ditolak
  const [downloading,  setDownloading]  = useState(false);

  // Export PDF/Excel hanya untuk paket Pro/Enterprise (back-end juga memblokir)
  const isFreePlan = useAuthStore((s) =>
    (s.user?.effective_plan ?? s.user?.subscription_plan ?? "free") === "free"
  );

  /**
   * getParams — Ubah preset periode menjadi query params API.
   * Preset "custom" tanpa tanggal lengkap → null (fetch dibatalkan).
   */
  const getParams = useCallback(() => {
    switch (preset) {
      case "today":   return { period: "daily",   date_from: todayStr(), date_to: todayStr() };
      case "7d":      return { period: "daily",   date_from: daysAgo(7),  date_to: todayStr() };
      case "30d":     return { period: "daily",   date_from: daysAgo(30), date_to: todayStr() };
      case "monthly": return { period: "monthly", year: filterYear };
      case "custom":
        if (!customFrom || !customTo) return null;
        return { period: "daily", date_from: customFrom, date_to: customTo };
      default:        return { period: "monthly", year: filterYear };
    }
  }, [preset, filterYear, customFrom, customTo]);

  /** fetchSales — Ambil data laporan penjualan sesuai params; 403 → tampilan akses ditolak. */
  const fetchSales = useCallback(async () => {
    const params = getParams();
    if (!params) return;
    setLoading(true);
    try {
      setSales(await reportService.getSales(params));
      setDenied(false);
    } catch (err) {
      if (err.response?.status === 403) setDenied(true);
    } finally { setLoading(false); }
  }, [getParams]);

  /** fetchStock — Ambil laporan stok (daftar produk + ringkasan). */
  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.getStock();
      setStock(res.data?.products ?? []);
      setStockSummary(res.data?.summary ?? null);
      setDenied(false);
    } catch (err) {
      if (err.response?.status === 403) setDenied(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "sales") fetchSales();
    else fetchStock();
  }, [tab, fetchSales, fetchStock]);

  /**
   * handleDownload — Unduh laporan PDF/Excel. Backend mengembalikan blob
   * (responseType blob) → triggerFileDownload membuat <a download> secara
   * otomatis dan mengekliknya; nama file pakai timestamp biar unik.
   */
  const handleDownload = async (format = "pdf") => {
    setDownloading(true);
    try {
      const params = tab === "sales" ? { ...getParams(), format } : { format };
      const res = tab === "sales"
        ? await reportService.downloadSales(params)
        : await reportService.downloadStock(params);
      const ext = format === "excel" ? "xlsx" : "pdf";
      triggerFileDownload(res, `laporan-${tab}-${Date.now()}.${ext}`);
    } catch { alert("Gagal mengunduh laporan"); }
    finally { setDownloading(false); }
  };

  // ── Derived chart data: data mentah → bentuk yang siap render ──
  const chartData = sales?.chart_data ?? [];

  // Hitung % kontribusi tiap produk dari total qty (dengan fallback 1 biar tak bagi 0)
  const totalQty    = (sales?.top_products ?? []).reduce((s, p) => s + (p.total_quantity ?? 0), 0) || 1;
  const topProds    = (sales?.top_products ?? [])
    .slice(0, 10)
    .map((p, i) => ({
      ...p,
      rank: i + 1,
      pct:  (((p.total_quantity ?? 0) / totalQty) * 100).toFixed(1),
    }));
  const topBarData  = topProds.map((p) => ({ name: p.name.split(" ").slice(0, 2).join(" "), qty: p.total_quantity ?? 0 }));

  // ── Definisi kolom tabel (per jenis data) ──
  const salesChartCols = [
    { key: "label",              label: "Periode" },
    { key: "total_revenue",      label: "Pendapatan",  render: (v) => <span className="font-mono font-bold">{formatCurrency(v)}</span> },
    { key: "total_transactions", label: "Transaksi",   render: (v) => <span className="font-mono">{v ?? 0}</span> },
  ];

  const topProdsCols = [
    { key: "rank",           label: "#",           render: (v) => <span className="font-black font-mono text-brand-black/50">#{v}</span> },
    { key: "name",           label: "Produk",      render: (v, row) => (
      <div>
        <p className="font-bold text-sm">{v}</p>
        <p className="text-[10px] font-mono text-brand-black/40">{row.sku}</p>
      </div>
    )},
    { key: "total_quantity", label: "Qty Terjual", render: (v) => <span className="font-black font-mono">{v ?? 0}</span> },
    { key: "total_revenue",  label: "Revenue",     render: (v) => <span className="font-mono font-bold">{formatCurrency(v ?? 0)}</span> },
    { key: "pct",            label: "% Total",     render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 border border-brand-black/20 bg-brand-gray overflow-hidden">
          <div className="h-full bg-brand-yellow" style={{ width: `${v}%` }} />
        </div>
        <span className="font-mono text-xs font-bold">{v}%</span>
      </div>
    )},
  ];

  const stockCols = [
    { key: "name",        label: "Produk",    render: (v, row) => (
      <div>
        <p className="font-bold text-sm">{v}</p>
        <p className="text-[10px] font-mono text-brand-black/40">{row.sku}</p>
      </div>
    )},
    { key: "category",    label: "Kategori",  render: (v) => v ?? <span className="text-brand-black/30">-</span> },
    { key: "stock",       label: "Stok",      render: (v, row) => (
      <span className={`font-mono font-black ${v === 0 ? "text-red-600" : v <= row.stock_alert ? "text-orange-500" : "text-green-700"}`}>
        {v}
      </span>
    )},
    { key: "stock_alert", label: "Min. Stok", render: (v) => <span className="font-mono text-brand-black/50">{v}</span> },
    { key: "stock_value", label: "Nilai Stok", render: (v) => <span className="font-mono font-bold">{formatCurrency(v ?? 0)}</span> },
    { key: "is_low_stock", label: "Status",   render: (v, row) => {
      if (row.stock === 0)    return <NeoBadge color="red">Habis</NeoBadge>;
      if (v)                  return <NeoBadge color="orange">Menipis</NeoBadge>;
      return <NeoBadge color="green">Normal</NeoBadge>;
    }},
  ];

    // ── Render: header + tombol export → tabs → konten per tab ──
  if (denied) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 page-fade">
      <div className="w-20 h-20 bg-red-100 border-2 border-brand-black flex items-center justify-center"
        style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
        <span className="text-4xl">🔒</span>
      </div>
      <h2 className="text-2xl font-black font-grotesk">Akses Ditolak</h2>
      <p className="text-sm text-brand-black/50 text-center max-w-xs">
        Halaman ini hanya bisa diakses oleh <strong>Admin</strong>.
      </p>
    </div>
  );

  return (
    <div className="space-y-5 page-fade">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-grotesk">Laporan</h2>
          <p className="text-sm text-brand-black/50">Analisis penjualan &amp; kondisi stok</p>
        </div>
        <div className="flex gap-2">
          {isFreePlan ? (
            <div className="text-[10px] font-mono font-bold text-brand-black/50 border border-dashed border-brand-black/30 px-3 py-2 flex items-center gap-1.5 max-w-[240px]">
              <AlertTriangle size={12} className="shrink-0" />
              Export PDF/Excel untuk paket <b>Pro &amp; Enterprise</b> —{" "}
              <a href="/upgrade?plan=pro" className="underline font-black">upgrade</a>
            </div>
          ) : (
            <>
              <NeoButton variant="secondary" size="sm" onClick={() => handleDownload("pdf")} disabled={downloading}>
                <Download size={13} />PDF
              </NeoButton>
              <NeoButton variant="dark" size="sm" onClick={() => handleDownload("excel")} disabled={downloading}>
                <Download size={13} />Excel
              </NeoButton>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b-2 border-brand-black">
        {[
          { key: "sales", label: "Penjualan" },
          { key: "stock", label: "Stok" },
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

      {/* ══════════════════ SALES TAB ══════════════════ */}
      {tab === "sales" && (
        <>
          {/* Period Presets */}
          <div className="flex flex-wrap gap-2 items-center">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`px-3 py-1.5 text-sm font-bold border-2 border-brand-black transition-colors
                  ${preset === p.id ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"}`}
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              >
                {p.label}
              </button>
            ))}

            {/* Year picker — visible only for monthly */}
            {preset === "monthly" && (
              <input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                min="2020" max="2099"
                className="w-24 px-3 py-1.5 text-sm font-mono border-2 border-brand-black outline-none"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              />
            )}
          </div>

          {/* Custom date range */}
          {preset === "custom" && (
            <div className="flex items-center gap-3 flex-wrap p-3 bg-brand-cream border-2 border-brand-black"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              <Calendar size={16} className="text-brand-black/50 shrink-0" />
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-1.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow bg-white"
                style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
              <span className="font-bold text-brand-black/50">s/d</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-1.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow bg-white"
                style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
              <NeoButton size="sm" variant="primary" onClick={fetchSales}>Tampilkan</NeoButton>
            </div>
          )}

          {/* Summary Cards — sesuai PRD: Revenue, Total Transaksi, Avg, Produk Terjual */}
          {sales?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Total Pendapatan"
                value={formatCurrency(sales.summary.total_revenue ?? 0)}
                icon={<Banknote size={20} />}
                color="yellow"
              />
              <StatCard
                label="Total Transaksi"
                value={sales.summary.total_orders ?? 0}
                icon={<Receipt size={20} />}
                color="black"
                sub="order dibayar"
              />
              <StatCard
                label="Rata-rata Transaksi"
                value={formatCurrency(sales.summary.avg_transaction ?? 0)}
                icon={<TrendingUp size={20} />}
              />
              <StatCard
                label="Produk Terjual"
                value={sales.summary.total_items ?? 0}
                icon={<ShoppingCart size={20} />}
                color="green"
                sub="total item"
              />
            </div>
          )}

          {/* Profit Cards — COGS, Laba Kotor, Margin (produk harus punya Harga Modal) */}
          {sales?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label="Harga Pokok (COGS)"
                value={formatCurrency(sales.summary.total_cogs ?? 0)}
                icon={<Package size={20} />}
                color="black"
                sub="modal barang terjual"
              />
              <StatCard
                label="Laba Kotor"
                value={formatCurrency(sales.summary.gross_profit ?? 0)}
                icon={<TrendingUp size={20} />}
                color="green"
                sub="revenue − COGS"
              />
              <StatCard
                label="Margin Laba"
                value={`${sales.summary.profit_margin ?? 0}%`}
                icon={<Receipt size={20} />}
                color="yellow"
                sub="dari total pendapatan"
              />
            </div>
          )}

          {/* Tren Penjualan — Line Chart */}
          {chartData.length > 0 && (
            <NeoCard noPad>
              <div className="px-5 py-4 border-b-2 border-brand-black">
                <h3 className="font-black text-sm font-grotesk">Tren Penjualan</h3>
                <p className="text-xs text-brand-black/40">Pendapatan per periode</p>
              </div>
              <div className="px-3 py-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="0" stroke="#0A0A0A" strokeOpacity={0.06} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                      axisLine={{ stroke: "#0A0A0A", strokeWidth: 2 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${(v/1_000).toFixed(0)}rb` : v}
                    />
                    <Tooltip content={<ChartTooltip currency />} />
                    <Line
                      type="monotone"
                      dataKey="total_revenue"
                      stroke="#FFE500"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#FFE500", stroke: "#0A0A0A", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#FFE500", stroke: "#0A0A0A", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </NeoCard>
          )}

          {/* Top Produk — Bar Chart */}
          {topBarData.length > 0 && (
            <NeoCard noPad>
              <div className="px-5 py-4 border-b-2 border-brand-black">
                <h3 className="font-black text-sm font-grotesk">Top Produk — Chart</h3>
              </div>
              <div className="px-3 py-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topBarData} margin={{ top: 5, right: 15, left: 0, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="0" stroke="#0A0A0A" strokeOpacity={0.06} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                      axisLine={{ stroke: "#0A0A0A", strokeWidth: 2 }}
                      tickLine={false}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#FFE500", fillOpacity: 0.15 }} />
                    <Bar dataKey="qty" stroke="#0A0A0A" strokeWidth={2}>
                      {topBarData.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? "#FFE500" : "#0A0A0A"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </NeoCard>
          )}

          {/* Top Produk — Tabel dengan Rank + % ─── PRD: "Rank, Nama, Qty, Revenue, % dari total" */}
          {topProds.length > 0 && (
            <NeoCard noPad>
              <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm font-grotesk">Top Produk Terlaris</h3>
                  <p className="text-xs text-brand-black/40">Rank, qty, revenue, dan % kontribusi</p>
                </div>
              </div>
              <NeoTable
                columns={topProdsCols}
                data={topProds}
                isLoading={loading}
                emptyText="Belum ada data produk"
              />
            </NeoCard>
          )}

          {/* Tabel Data Mentah */}
          <NeoCard noPad>
            <div className="px-5 py-4 border-b-2 border-brand-black">
              <h3 className="font-black text-sm font-grotesk">Data Penjualan Per Periode</h3>
            </div>
            <NeoTable columns={salesChartCols} data={chartData} isLoading={loading} emptyText="Belum ada data penjualan" />
          </NeoCard>
        </>
      )}

      {/* ══════════════════ STOCK TAB ══════════════════ */}
      {tab === "stock" && (
        <>
          {/* Summary Cards — PRD: Total Aktif, Menipis, Habis, Nilai Total */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total Produk Aktif"
              value={stockSummary?.total_products ?? stock.length}
              icon={<Package size={20} />}
            />
            <StatCard
              label="Stok Menipis"
              value={stockSummary?.low_stock_count ?? stock.filter((p) => p.is_low_stock).length}
              icon={<AlertTriangle size={20} />}
              color={(stockSummary?.low_stock_count ?? 0) > 0 ? "orange" : "white"}
              sub="perlu restock"
            />
            <StatCard
              label="Stok Habis"
              value={stockSummary?.out_of_stock_count ?? stock.filter((p) => p.stock === 0).length}
              icon={<Package size={20} />}
              color={(stockSummary?.out_of_stock_count ?? 0) > 0 ? "yellow" : "white"}
            />
            <StatCard
              label="Nilai Total Stok"
              value={formatCurrency(stockSummary?.total_stock_value ?? stock.reduce((s, p) => s + (p.stock_value ?? 0), 0))}
              icon={<Banknote size={20} />}
              color="yellow"
            />
          </div>

          {/* Tabel Stok */}
          <NeoCard noPad>
            <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm font-grotesk">Kondisi Stok Semua Produk</h3>
                <p className="text-xs text-brand-black/40">Diurutkan dari stok paling sedikit</p>
              </div>
            </div>
            <NeoTable columns={stockCols} data={stock} isLoading={loading} emptyText="Belum ada data stok" />
          </NeoCard>
        </>
      )}
    </div>
  );
}
