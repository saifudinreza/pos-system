"use client";

// ============================================================
// Orders Page — Daftar pesanan + detail + aksi status
//
// Data yang diambil:
//   - useOrders hook → GET /api/orders (filter status & rentang tanggal,
//     pagination via meta)
//   - orderService.getById(id) → detail satu order (modal)
//
// Aksi per status:
//   pending   → tandai lunas (updateStatus "paid") atau batalkan ("cancelled")
//   paid      → void (butuh PIN admin via prompt)
// Aksi di-route ke OrderController::updateStatus() di backend yang juga
// mencatat inventory movement & mengirim struk WhatsApp (async job).
// ============================================================

import { useState } from "react";
import { useOrders }   from "@/hooks/useOrders";
import orderService    from "@/services/orderService";
import NeoTable  from "@/components/ui/NeoTable";
import NeoBadge  from "@/components/ui/NeoBadge";
import NeoButton from "@/components/ui/NeoButton";
import NeoModal  from "@/components/ui/NeoModal";
import { formatCurrency, formatDateTime, getOrderStatusConfig, getErrorMessage } from "@/lib/utils";

/**
 * OrderDetailModal — Modal detail satu order: info pelanggan, item,
 * subtotal/PPN/total, catatan, dan tombol aksi sesuai status.
 * onVoid(id, status) & onMarkPaid(id) dioper dari halaman utama.
 */
function OrderDetailModal({ order, onClose, onVoid, onMarkPaid }) {
  if (!order) return null;
  const status = getOrderStatusConfig(order.status);
  return (
    <NeoModal isOpen={!!order} onClose={onClose} title={`Order ${order.order_number}`} size="lg">
      <div className="space-y-4">
        {/* Status + info */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <NeoBadge color={order.status === "paid" ? "green" : order.status === "cancelled" ? "red" : "yellow"}>
            {status.label}
          </NeoBadge>
          <span className="text-xs font-mono text-brand-black/50">{formatDateTime(order.created_at)}</span>
        </div>

        {/* Customer info */}
        {order.user && (
          <div className="p-3 bg-brand-cream border-2 border-brand-black/10">
            <p className="text-xs font-black uppercase tracking-wider text-brand-black/40 mb-1">Pelanggan</p>
            <p className="font-bold text-sm">{order.user.name}</p>
            <p className="text-xs text-brand-black/50 font-mono">{order.user.email}</p>
          </div>
        )}

        {/* Items */}
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-brand-black/40 mb-2">Item Pesanan</p>
          <div className="border-2 border-brand-black overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-cream border-b-2 border-brand-black">
                  <th className="px-3 py-2 text-left text-xs font-black text-brand-black/60">Produk</th>
                  <th className="px-3 py-2 text-center text-xs font-black text-brand-black/60">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-black text-brand-black/60">Harga</th>
                  <th className="px-3 py-2 text-right text-xs font-black text-brand-black/60">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-black/10">
                {(order.items ?? order.order_items ?? []).map((item, i) => (
                  <tr key={i} className="hover:bg-brand-yellow/5">
                    <td className="px-3 py-2 font-medium text-sm">{item.product_name ?? item.product?.name ?? item.name ?? "-"}</td>
                    <td className="px-3 py-2 text-center font-mono text-sm">{item.quantity}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(item.price ?? item.unit_price)}</td>
                    <td className="px-3 py-2 text-right font-black font-mono text-sm">{formatCurrency((item.price ?? item.unit_price) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          {order.subtotal && (
            <div className="flex justify-between text-brand-black/60">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(order.subtotal)}</span>
            </div>
          )}
          {order.tax && (
            <div className="flex justify-between text-xs text-brand-black/50">
              <span>Pajak</span>
              <span className="font-mono">{formatCurrency(order.tax)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-base border-t-2 border-brand-black pt-2">
            <span>TOTAL</span>
            <span className="font-mono">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-3 bg-brand-cream border border-brand-black/20 text-sm text-brand-black/70">
            <span className="font-bold text-xs text-brand-black/40">Catatan: </span>{order.notes}
          </div>
        )}

        {/* Actions */}
        {order.status !== "cancelled" && order.status !== "void" && (
          <div className="flex gap-3 justify-end pt-2 border-t border-brand-black/10">
            {order.status === "pending" && (
              <>
                {/* Tandai Lunas: berguna untuk bayar tunai atau testing tanpa ngrok */}
                <NeoButton variant="primary" size="sm" onClick={() => onMarkPaid(order.id)}>
                  ✓ Tandai Lunas
                </NeoButton>
                <NeoButton variant="danger" size="sm" onClick={() => onVoid(order.id, "cancelled")}>
                  Batalkan Order
                </NeoButton>
              </>
            )}
            {order.status === "paid" && (
              <NeoButton variant="danger" size="sm" onClick={() => onVoid(order.id, "void")}>
                🔒 Void (Admin)
              </NeoButton>
            )}
          </div>
        )}
      </div>
    </NeoModal>
  );
}

export default function OrdersPage() {
  const { orders, meta, isLoading, updateFilters, goToPage, updateStatus } = useOrders();
  const [detailOrder, setDetailOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  /**
   * openDetail — Ambil detail lengkap order (GET /api/orders/{id}) lalu
   * tampilkan di modal. Response bisa berbentuk { data } atau langsung objek.
   */
  const openDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const data = await orderService.getById(id);
      setDetailOrder(data.data ?? data);
    } catch { alert("Gagal memuat detail order"); }
    finally { setLoadingDetail(false); }
  };

  /** handleMarkPaid — Tandai order pending menjadi lunas (bayar tunai/manual). */
  const handleMarkPaid = async (id) => {
    if (!confirm("Tandai order ini sebagai LUNAS? (Bayar Tunai / Manual)")) return;
    try {
      await updateStatus(id, "paid");
      setDetailOrder(null);
    } catch (err) { alert(getErrorMessage(err)); }
  };

  /**
   * handleVoid — Batalkan (cancelled) atau void order. Status "void" butuh
   * PIN admin yang diminta via prompt; PIN divalidasi di backend.
   */
  const handleVoid = async (id, status) => {
    if (!confirm(`${status === "void" ? "VOID" : "Batalkan"} order ini? Tindakan tidak dapat dibatalkan.`)) return;
    if (status === "void") {
      const pin = prompt("Masukkan PIN Admin untuk konfirmasi void:");
      if (!pin) return;
    }
    try {
      await updateStatus(id, status);
      setDetailOrder(null);
    } catch (err) { alert(getErrorMessage(err)); }
  };

  // ── Definisi kolom tabel ──
  const columns = [
    {
      key: "order_number", label: "No. Order",
      render: (v, row) => (
        <button onClick={() => openDetail(row.id)} className="font-bold text-sm font-mono underline underline-offset-2 hover:opacity-70 text-left">
          {v}
        </button>
      ),
    },
    { key: "user",    label: "Pelanggan", render: (v) => <span className="text-sm">{v?.name ?? "-"}</span> },
    {
      key: "status", label: "Status",
      render: (v) => <NeoBadge color={v === "paid" ? "green" : v === "cancelled" ? "red" : v === "void" ? "red" : "yellow"}>{getOrderStatusConfig(v).label}</NeoBadge>,
    },
    { key: "total",      label: "Total",   render: (v) => <span className="font-mono font-bold text-sm">{formatCurrency(v)}</span> },
    { key: "created_at", label: "Tanggal", render: (v) => <span className="text-xs font-mono">{formatDateTime(v)}</span> },
    {
      key: "id", label: "Aksi",
      render: (id, row) => (
        <div className="flex gap-2">
          <NeoButton size="sm" variant="secondary" onClick={() => openDetail(id)} disabled={loadingDetail}>
            Detail
          </NeoButton>
          {row.status === "pending" && (
            <NeoButton size="sm" variant="danger" onClick={() => handleVoid(id, "cancelled")}>
              Batalkan
            </NeoButton>
          )}
        </div>
      ),
    },
  ];

  // ── Render: header → filter status/tanggal → tabel → pagination → modal detail ──
  return (
    <div className="space-y-5 page-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-grotesk">Pesanan</h2>
          <p className="text-sm text-brand-black/50">{meta?.total ?? 0} pesanan</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu Bayar</option>
          <option value="paid">Lunas</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
        <input type="date" className="px-3 py-2 text-sm border-2 border-brand-black outline-none"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          onChange={(e) => updateFilters({ date_from: e.target.value, page: 1 })} />
        <input type="date" className="px-3 py-2 text-sm border-2 border-brand-black outline-none"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          onChange={(e) => updateFilters({ date_to: e.target.value, page: 1 })} />
      </div>

      <NeoTable columns={columns} data={orders} isLoading={isLoading} emptyText="Belum ada pesanan" />

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: Math.min(meta.last_page, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => goToPage(p)}
              className={`w-9 h-9 text-sm font-bold border-2 border-brand-black ${p === meta.current_page ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"}`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >{p}</button>
          ))}
        </div>
      )}

      <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} onVoid={handleVoid} onMarkPaid={handleMarkPaid} />
    </div>
  );
}
