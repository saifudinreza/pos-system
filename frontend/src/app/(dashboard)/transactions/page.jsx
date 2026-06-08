"use client";

import { useState, useEffect, useCallback } from "react";
import transactionService from "@/services/transactionService";
import NeoTable  from "@/components/ui/NeoTable";
import NeoModal  from "@/components/ui/NeoModal";
import NeoBadge  from "@/components/ui/NeoBadge";
import NeoButton from "@/components/ui/NeoButton";
import { formatCurrency, formatDateTime, getTransactionStatusConfig } from "@/lib/utils";

// ── Status colours ──────────────────────────────────────────────
const STATUS_COLOR = {
  settlement: "green",
  pending:    "yellow",
  expire:     "gray",
  cancel:     "red",
  deny:       "red",
};

// ── Detail modal ────────────────────────────────────────────────
function TransactionDetailModal({ txId, onClose, onCancelled }) {
  const [tx,         setTx]         = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (!txId) return;
    setLoading(true);
    setError("");
    transactionService.getById(txId)
      .then(setTx)
      .catch(() => setError("Gagal memuat detail transaksi."))
      .finally(() => setLoading(false));
  }, [txId]);

  const handleCancel = async () => {
    if (!confirm("Batalkan transaksi ini? Stok produk akan dikembalikan dan order akan dibatalkan.")) return;
    setCancelling(true);
    try {
      await transactionService.cancel(txId);
      onCancelled?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? "Gagal membatalkan transaksi.");
    } finally {
      setCancelling(false);
    }
  };

  const statusCfg = tx ? getTransactionStatusConfig(tx.status) : null;
  const isPending  = tx?.status === "pending";

  return (
    <NeoModal
      isOpen={!!txId}
      onClose={onClose}
      title="Detail Transaksi"
      size="md"
      footer={
        <div className="flex gap-3 w-full">
          {isPending && !loading && (
            <NeoButton
              variant="danger"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1"
            >
              {cancelling ? "Membatalkan..." : "✕  Batalkan Transaksi"}
            </NeoButton>
          )}
          <NeoButton variant="ghost" onClick={onClose} className={isPending ? "" : "ml-auto"}>
            Tutup
          </NeoButton>
        </div>
      }
    >
      {loading && (
        <div className="py-12 text-center text-sm text-brand-black/40 font-mono animate-pulse">
          Memuat detail…
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-300 text-sm text-red-700 font-semibold rounded-md">
          {error}
        </div>
      )}

      {!loading && tx && (
        <div className="space-y-5">
          {/* Status + amount hero */}
          <div className="flex items-start justify-between gap-3 p-4 border-2 border-brand-black rounded-md bg-brand-cream"
               style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
            <div>
              <p className="text-xs font-mono text-brand-black/40 mb-1">Status Pembayaran</p>
              <NeoBadge color={STATUS_COLOR[tx.status] ?? "gray"}>
                {statusCfg?.label ?? tx.status}
              </NeoBadge>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-brand-black/40 mb-1">Jumlah</p>
              <p className="font-black text-xl font-mono">{formatCurrency(tx.amount)}</p>
            </div>
          </div>

          {/* Transaction info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "ID Transaksi",         val: `#${tx.id}` },
              { label: "Midtrans Order ID",    val: tx.midtrans_order_id ?? "-" },
              { label: "Midtrans Tx ID",       val: tx.midtrans_transaction_id ?? "-" },
              { label: "Metode Pembayaran",    val: tx.payment_method ? tx.payment_method.toUpperCase() : "Belum dipilih" },
              { label: "Dibuat",               val: formatDateTime(tx.created_at) },
              { label: "Dibayar",              val: tx.paid_at ?? "-" },
            ].map(({ label, val }) => (
              <div key={label} className="p-3 bg-white border border-brand-black/10 rounded-md">
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-black/40 mb-0.5">{label}</p>
                <p className="font-mono text-xs font-bold break-all">{val}</p>
              </div>
            ))}
          </div>

          {/* Linked order */}
          {tx.order && (
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-brand-black/40 mb-2">Order Terkait</p>
              <div className="border-2 border-brand-black rounded-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-brand-black text-white">
                  <span className="font-bold text-xs font-mono">{tx.order.order_number}</span>
                  <NeoBadge color={
                    tx.order.status === "paid" ? "green" :
                    tx.order.status === "cancelled" ? "red" : "yellow"
                  }>
                    {tx.order.status === "paid" ? "Lunas" : tx.order.status === "cancelled" ? "Dibatalkan" : "Menunggu"}
                  </NeoBadge>
                </div>

                {/* Order items */}
                {tx.order.items && tx.order.items.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-brand-cream border-b border-brand-black/10">
                        <th className="px-3 py-2 text-left font-black text-brand-black/50">Produk</th>
                        <th className="px-3 py-2 text-center font-black text-brand-black/50">Qty</th>
                        <th className="px-3 py-2 text-right font-black text-brand-black/50">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-black/5">
                      {tx.order.items.map((item, i) => (
                        <tr key={i} className="hover:bg-brand-yellow/5">
                          <td className="px-3 py-2 font-medium">{item.product_name}</td>
                          <td className="px-3 py-2 text-center font-mono">{item.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Order totals */}
                <div className="px-4 py-3 bg-brand-cream border-t-2 border-brand-black space-y-1">
                  {tx.order.subtotal && (
                    <div className="flex justify-between text-xs text-brand-black/60">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatCurrency(tx.order.subtotal)}</span>
                    </div>
                  )}
                  {tx.order.tax && (
                    <div className="flex justify-between text-xs text-brand-black/50">
                      <span>Pajak (11%)</span>
                      <span className="font-mono">{formatCurrency(tx.order.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm border-t border-brand-black/20 pt-1">
                    <span>TOTAL</span>
                    <span className="font-mono">{formatCurrency(tx.order.total)}</span>
                  </div>
                </div>

                {tx.order.notes && (
                  <div className="px-4 py-2 text-xs text-brand-black/50 border-t border-brand-black/10">
                    <span className="font-bold">Catatan:</span> {tx.order.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </NeoModal>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [meta,         setMeta]         = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [filters,      setFilters]      = useState({ page: 1, per_page: 10 });
  const [detailTxId,   setDetailTxId]   = useState(null);

  const [fetchError, setFetchError] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const data = await transactionService.getAll(filters);
      setTransactions(data.data ?? []);
      setMeta(data.meta ?? null);
    } catch (err) {
      setFetchError(err.response?.data?.message ?? "Gagal memuat data transaksi.");
      setTransactions([]);
    } finally { setIsLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    {
      key: "order", label: "No. Order",
      render: (v, row) => (
        <button
          onClick={() => setDetailTxId(row.id)}
          className="font-mono text-xs font-bold underline underline-offset-2 hover:opacity-70 text-left"
        >
          {v?.order_number ?? "-"}
        </button>
      ),
    },
    {
      key: "payment_method", label: "Metode",
      render: (v) => v
        ? <span className="uppercase text-xs font-black font-mono bg-brand-black/5 px-2 py-0.5 rounded">{v}</span>
        : <span className="text-xs text-brand-black/30 font-mono italic">-</span>,
    },
    {
      key: "status", label: "Status",
      render: (v) => {
        const s = getTransactionStatusConfig(v);
        return <NeoBadge color={STATUS_COLOR[v] ?? "gray"}>{s.label}</NeoBadge>;
      },
    },
    {
      key: "amount", label: "Jumlah",
      render: (v) => <span className="font-mono font-bold">{formatCurrency(v)}</span>,
    },
    { key: "paid_at",    label: "Dibayar",  render: (v) => v ? <span className="text-xs font-mono">{formatDateTime(v)}</span> : <span className="text-brand-black/30 text-xs">-</span> },
    { key: "created_at", label: "Dibuat",   render: (v) => <span className="text-xs font-mono">{formatDateTime(v)}</span> },
    {
      key: "id", label: "Aksi",
      render: (id, row) => (
        <div className="flex gap-2">
          <NeoButton size="sm" variant="secondary" onClick={() => setDetailTxId(id)}>
            Detail
          </NeoButton>
          {row.status === "pending" && (
            <NeoButton
              size="sm"
              variant="danger"
              onClick={async () => {
                if (!confirm("Batalkan transaksi ini? Stok akan dikembalikan.")) return;
                try {
                  await transactionService.cancel(id);
                  fetchData();
                } catch (err) {
                  alert(err.response?.data?.message ?? "Gagal membatalkan.");
                }
              }}
            >
              Batalkan
            </NeoButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black font-grotesk">Transaksi</h2>
          <p className="text-sm text-brand-black/50">{meta?.total ?? 0} transaksi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white rounded-md"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="settlement">Berhasil</option>
          <option value="expire">Kadaluarsa</option>
          <option value="cancel">Dibatalkan</option>
        </select>
        <input
          type="date"
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none rounded-md"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value, page: 1 }))}
        />
        <input
          type="date"
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none rounded-md"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value, page: 1 }))}
        />
      </div>

      {fetchError && (
        <div className="p-3 bg-red-50 border-2 border-red-300 text-sm text-red-700 font-semibold rounded-md">
          {fetchError}
        </div>
      )}

      <NeoTable columns={columns} data={transactions} isLoading={isLoading} emptyText="Belum ada transaksi" />

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: Math.min(meta.last_page, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
              className={`w-9 h-9 text-sm font-bold border-2 border-brand-black rounded-md ${
                p === meta.current_page ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"
              }`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail + Cancel modal */}
      <TransactionDetailModal
        txId={detailTxId}
        onClose={() => setDetailTxId(null)}
        onCancelled={fetchData}
      />
    </div>
  );
}
