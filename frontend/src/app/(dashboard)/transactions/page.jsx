"use client";

// Transactions Page — Daftar transaksi pembayaran (GET /api/transactions)
import { useState, useEffect } from "react";
import transactionService from "@/services/transactionService";
import NeoTable from "@/components/ui/NeoTable";
import NeoBadge from "@/components/ui/NeoBadge";
import { formatCurrency, formatDateTime, getTransactionStatusConfig } from "@/lib/utils";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [meta,         setMeta]         = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [filters,      setFilters]      = useState({ page: 1, per_page: 10 });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await transactionService.getAll(filters);
      setTransactions(data.data ?? []);
      setMeta(data.meta ?? null);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const STATUS_COLOR = {
    settlement: "green", pending: "yellow", expire: "gray", cancel: "red", deny: "red",
  };

  const columns = [
    { key: "order",            label: "No. Order",    render: (v) => <span className="font-mono text-xs">{v?.order_number ?? "-"}</span> },
    { key: "payment_method",   label: "Metode",       render: (v) => v ? <span className="uppercase text-xs font-bold font-mono">{v}</span> : "-" },
    { key: "status",           label: "Status",
      render: (v) => { const s = getTransactionStatusConfig(v); return <NeoBadge color={STATUS_COLOR[v] ?? "gray"}>{s.label}</NeoBadge>; } },
    { key: "amount",           label: "Jumlah",       render: (v) => <span className="font-mono font-bold">{formatCurrency(v)}</span> },
    { key: "paid_at",          label: "Dibayar",      render: (v) => v ? formatDateTime(v) : "-" },
    { key: "created_at",       label: "Dibuat",       render: (v) => formatDateTime(v) },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black font-grotesk">Transaksi</h2>
          <p className="text-sm text-brand-black/50">{meta?.total ?? 0} transaksi</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="settlement">Berhasil</option>
          <option value="expire">Kadaluarsa</option>
          <option value="cancel">Dibatalkan</option>
        </select>
        <input type="date" className="px-3 py-2 text-sm border-2 border-brand-black outline-none"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value, page: 1 }))} />
        <input type="date" className="px-3 py-2 text-sm border-2 border-brand-black outline-none"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value, page: 1 }))} />
      </div>

      <NeoTable columns={columns} data={transactions} isLoading={isLoading} emptyText="Belum ada transaksi" />

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(meta.last_page, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
              className={`w-9 h-9 text-sm font-bold border-2 border-brand-black ${p === meta.current_page ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"}`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
