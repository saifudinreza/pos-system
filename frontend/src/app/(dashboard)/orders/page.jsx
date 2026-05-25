"use client";

// Orders Page — Daftar semua pesanan
import { useOrders } from "@/hooks/useOrders";
import NeoTable  from "@/components/ui/NeoTable";
import NeoBadge  from "@/components/ui/NeoBadge";
import Link from "next/link";
import { formatCurrency, formatDateTime, getOrderStatusConfig } from "@/lib/utils";

export default function OrdersPage() {
  const { orders, meta, isLoading, filters, updateFilters, goToPage, updateStatus } = useOrders();

  const columns = [
    { key: "order_number", label: "No. Order",
      render: (v, row) => <Link href={`/orders/${row.id}`} className="font-bold text-sm underline underline-offset-2 hover:opacity-70">{v}</Link> },
    { key: "user",       label: "Pelanggan", render: (v) => v?.name ?? "-" },
    { key: "status",     label: "Status",
      render: (v) => { const s = getOrderStatusConfig(v); return <NeoBadge color={v === "paid" ? "green" : v === "cancelled" ? "red" : "yellow"}>{s.label}</NeoBadge>; } },
    { key: "total",      label: "Total",     render: (v) => <span className="font-mono font-bold">{formatCurrency(v)}</span> },
    { key: "created_at", label: "Tanggal",   render: (v) => formatDateTime(v) },
    {
      key: "id", label: "Aksi",
      render: (id, row) => row.status === "pending" && (
        <button onClick={() => updateStatus(id, "cancelled")} className="text-xs font-bold text-red-500 hover:underline">Batalkan</button>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black font-grotesk">Pesanan</h2>
          <p className="text-sm text-brand-black/50">{meta?.total ?? 0} pesanan</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select onChange={(e) => updateFilters({ status: e.target.value })}
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
          <option value="">Semua Status</option>
          <option value="pending">Menunggu Bayar</option>
          <option value="paid">Lunas</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
        <input type="date" className="px-3 py-2 text-sm border-2 border-brand-black outline-none"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          onChange={(e) => updateFilters({ date_from: e.target.value })} />
        <input type="date" className="px-3 py-2 text-sm border-2 border-brand-black outline-none"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          onChange={(e) => updateFilters({ date_to: e.target.value })} />
      </div>

      <NeoTable columns={columns} data={orders} isLoading={isLoading} emptyText="Belum ada pesanan" />

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(meta.last_page, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => goToPage(p)}
              className={`w-9 h-9 text-sm font-bold border-2 border-brand-black ${p === meta.current_page ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"}`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
