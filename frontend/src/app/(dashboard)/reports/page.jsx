"use client";

// Reports Page — Laporan penjualan & stok
import { useState, useEffect } from "react";
import reportService, { triggerFileDownload } from "@/services/reportService";
import StatCard from "@/components/dashboard/StatCard";
import NeoButton from "@/components/ui/NeoButton";
import NeoTable  from "@/components/ui/NeoTable";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [period, setPeriod]       = useState("monthly");
  const [year,   setYear]         = useState(new Date().getFullYear());
  const [sales,  setSales]        = useState(null);
  const [stock,  setStock]        = useState([]);
  const [loading, setLoading]     = useState(false);
  const [tab,    setTab]          = useState("sales");

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await reportService.getSales({ period, year });
      setSales(data);
    } finally { setLoading(false); }
  };

  const fetchStock = async () => {
    setLoading(true);
    try {
      const data = await reportService.getStock();
      setStock(data.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === "sales") fetchSales();
    else                 fetchStock();
  }, [tab, period, year]);

  const handleDownload = async (type) => {
    try {
      const res = type === "sales"
        ? await reportService.downloadSales({ period, year })
        : await reportService.downloadStock();
      triggerFileDownload(res, `laporan-${type}-${Date.now()}.pdf`);
    } catch { alert("Gagal mengunduh laporan"); }
  };

  const salesColumns = [
    { key: "label",  label: "Periode" },
    { key: "revenue", label: "Pendapatan", render: (v) => <span className="font-mono font-bold">{formatCurrency(v)}</span> },
    { key: "orders",  label: "Order",      render: (v) => <span className="font-mono">{v}</span> },
    { key: "items",   label: "Item Terjual", render: (v) => <span className="font-mono">{v}</span> },
  ];

  const stockColumns = [
    { key: "name",        label: "Produk" },
    { key: "sku",         label: "SKU",        render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: "stock",       label: "Stok",       render: (v, r) => <span className={`font-mono font-bold ${r.is_low_stock ? "text-red-600" : "text-green-700"}`}>{v}</span> },
    { key: "stock_alert", label: "Min. Stok",  render: (v) => <span className="font-mono">{v}</span> },
    { key: "is_low_stock", label: "Status",    render: (v) => <span className={`text-xs font-black ${v ? "text-red-600" : "text-green-600"}`}>{v ? "⚠️ Rendah" : "✓ Aman"}</span> },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-black font-grotesk">Laporan</h2>
        <NeoButton variant="dark" size="sm" onClick={() => handleDownload(tab)}>
          ↓ Unduh Laporan
        </NeoButton>
      </div>

      {/* Tab Sales / Stock */}
      <div className="flex border-b-2 border-brand-black">
        {["sales", "stock"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 font-bold text-sm capitalize border-b-2 -mb-0.5 transition-colors
              ${tab === t ? "border-brand-black bg-brand-yellow" : "border-transparent hover:bg-brand-yellow/20"}`}>
            {t === "sales" ? "Penjualan" : "Stok"}
          </button>
        ))}
      </div>

      {tab === "sales" && (
        <>
          {/* Filter */}
          <div className="flex gap-3 flex-wrap items-center">
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              <option value="monthly">Bulanan</option>
              <option value="daily">Harian</option>
            </select>
            {period === "monthly" && (
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                min="2020" max="2099" placeholder="Tahun"
                className="w-24 px-3 py-2 text-sm border-2 border-brand-black outline-none"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }} />
            )}
          </div>

          {/* Stat ringkasan */}
          {sales?.summary && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Pendapatan" value={formatCurrency(sales.summary.total_revenue)} icon="💰" color="yellow" />
              <StatCard label="Total Order"      value={sales.summary.total_orders}                  icon="🧾" />
              <StatCard label="Item Terjual"     value={sales.summary.total_items}                   icon="📦" />
            </div>
          )}

          <NeoTable columns={salesColumns} data={sales?.data ?? []} isLoading={loading} emptyText="Belum ada data penjualan" />
        </>
      )}

      {tab === "stock" && (
        <NeoTable columns={stockColumns} data={stock} isLoading={loading} emptyText="Belum ada data stok" />
      )}
    </div>
  );
}
