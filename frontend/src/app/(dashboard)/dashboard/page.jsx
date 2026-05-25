"use client";

// ============================================================
// Dashboard Page — Halaman ringkasan utama
//
// Analogi: Ini seperti "layar monitor di ruang kontrol" —
// menampilkan semua angka penting (penjualan, order, stok) dalam
// satu layar tanpa perlu buka halaman lain.
//
// Data diambil dari:
//   GET /api/reports/sales?period=daily → penjualan hari ini
//   GET /api/reports/stock → produk stok rendah
//   GET /api/orders?status=pending → order yang belum dibayar
// ============================================================

import { useState, useEffect } from "react";
import StatCard from "@/components/dashboard/StatCard";
import NeoCard  from "@/components/ui/NeoCard";
import reportService from "@/services/reportService";
import orderService  from "@/services/orderService";
import { formatCurrency, formatDateTime, getOrderStatusConfig } from "@/lib/utils";

export default function DashboardPage() {
  const [sales, setSales]     = useState(null);
  const [stock, setStock]     = useState([]);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Ambil semua data dashboard secara paralel
        // Analogi: bagian gudang, kasir, dan akuntan lapor serentak
        const [salesData, stockData, ordersData] = await Promise.allSettled([
          reportService.getSales({ period: "daily" }),
          reportService.getStock(),
          orderService.getAll({ per_page: 5 }),
        ]);

        if (salesData.status  === "fulfilled") setSales(salesData.value?.summary ?? salesData.value);
        if (stockData.status  === "fulfilled") setStock(stockData.value?.data?.filter((p) => p.is_low_stock) ?? []);
        if (ordersData.status === "fulfilled") setOrders(ordersData.value?.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-brand-black font-grotesk">Dashboard</h2>
        <p className="text-sm text-brand-black/50 font-medium mt-1">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Penjualan Hari Ini"
          value={loading ? "..." : formatCurrency(sales?.total_revenue ?? 0)}
          icon="💰" color="yellow"
        />
        <StatCard
          label="Total Order"
          value={loading ? "..." : (sales?.total_orders ?? 0)}
          icon="🧾" color="white"
          sub="Hari ini"
        />
        <StatCard
          label="Item Terjual"
          value={loading ? "..." : (sales?.total_items ?? 0)}
          icon="📦" color="white"
        />
        <StatCard
          label="Stok Hampir Habis"
          value={loading ? "..." : stock.length}
          icon="⚠️" color={stock.length > 0 ? "yellow" : "white"}
          sub="produk perlu restock"
        />
      </div>

      {/* Dua kolom bawah: order terbaru + stok rendah */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Order terbaru */}
        <NeoCard noPad>
          <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
            <h3 className="font-black text-base font-grotesk">Order Terbaru</h3>
            <a href="/orders" className="text-xs font-bold text-brand-black/50 hover:text-brand-black underline">Lihat semua →</a>
          </div>
          <div className="divide-y divide-brand-black/10">
            {loading ? (
              <div className="py-8 text-center text-sm text-brand-black/40">Memuat...</div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-sm text-brand-black/40">Belum ada order</div>
            ) : (
              orders.map((order) => {
                const status = getOrderStatusConfig(order.status);
                return (
                  <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-brand-black">{order.order_number}</p>
                      <p className="text-xs text-brand-black/50">{formatDateTime(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black border px-2 py-0.5 ${status.color}`}>{status.label}</span>
                      <span className="font-bold text-sm font-mono">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </NeoCard>

        {/* Stok hampir habis */}
        <NeoCard noPad>
          <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between">
            <h3 className="font-black text-base font-grotesk">Stok Hampir Habis</h3>
            <a href="/products?low_stock=true" className="text-xs font-bold text-brand-black/50 hover:text-brand-black underline">Lihat semua →</a>
          </div>
          <div className="divide-y divide-brand-black/10">
            {loading ? (
              <div className="py-8 text-center text-sm text-brand-black/40">Memuat...</div>
            ) : stock.length === 0 ? (
              <div className="py-8 text-center text-sm text-green-600 font-semibold">✓ Semua stok aman</div>
            ) : (
              stock.slice(0, 6).map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-brand-black">{p.name}</p>
                    <p className="text-xs text-brand-black/50 font-mono">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm font-mono ${p.stock <= 5 ? "text-red-600" : "text-orange-500"}`}>
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
