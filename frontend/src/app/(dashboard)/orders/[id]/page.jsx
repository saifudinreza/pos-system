"use client";

// Order Detail Page, Detail satu pesanan (GET /api/orders/{id})
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import orderService from "@/services/orderService";
import NeoCard  from "@/components/ui/NeoCard";
import NeoBadge from "@/components/ui/NeoBadge";
import { formatCurrency, formatDateTime, getOrderStatusConfig } from "@/lib/utils";

export default function OrderDetailPage() {
  // ── State: ambil id order dari URL, lalu fetch detail satu kali ──
  const params       = useParams();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil detail order (GET /api/orders/{id}), refetch kalau id berubah
  useEffect(() => {
    orderService.getById(params.id)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [params.id]);

  // ── Guard: loading & not-found sebelum render isi halaman ──
  if (loading) return <div className="p-8 text-center text-brand-black/50">Memuat...</div>;
  if (!order)  return <div className="p-8 text-center text-red-500">Order tidak ditemukan</div>;

  const status = getOrderStatusConfig(order.status);

  // ── Render: header order → info pelanggan → daftar item → total ──
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/orders" className="text-sm font-bold text-brand-black/50 hover:text-brand-black">← Kembali</Link>
        <h2 className="text-2xl font-black font-grotesk">{order.order_number}</h2>
        <NeoBadge color={order.status === "paid" ? "green" : order.status === "cancelled" ? "red" : "yellow"}>
          {status.label}
        </NeoBadge>
      </div>

      <NeoCard>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-brand-black/60">Pelanggan</span>
            <span className="font-bold">{order.user?.name ?? "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-brand-black/60">Tanggal</span>
            <span className="font-bold">{formatDateTime(order.created_at)}</span>
          </div>
          {order.notes && (
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-brand-black/60">Catatan</span>
              <span className="font-medium">{order.notes}</span>
            </div>
          )}
        </div>
      </NeoCard>

      {/* Item-item order */}
      <NeoCard noPad>
        <div className="px-5 py-3 border-b-2 border-brand-black">
          <h3 className="font-black">Item Pesanan</h3>
        </div>
        <div className="divide-y divide-brand-black/10">
          {order.items?.map((item) => (
            <div key={item.id} className="px-5 py-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">{item.product_name ?? item.product?.name ?? "-"}</p>
                <p className="text-xs text-brand-black/50 font-mono">{formatCurrency(item.price)} × {item.quantity}</p>
              </div>
              <span className="font-black font-mono">{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-brand-gray space-y-1 border-t-2 border-brand-black">
          <div className="flex justify-between text-sm font-semibold">
            <span>Subtotal</span><span className="font-mono">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-brand-black/60">
            <span>PPN 11%</span><span className="font-mono">{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between text-base font-black border-t-2 border-brand-black pt-2 mt-2">
            <span>TOTAL</span><span className="font-mono">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
