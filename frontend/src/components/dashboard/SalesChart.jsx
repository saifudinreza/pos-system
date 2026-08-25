"use client";

// ============================================================
// SalesChart, grafik garis penjualan (recharts) di dashboard
//
// Props: data = [{ label, total_revenue, order_count? }]
//   - label        : label sumbu-X (tanggal/hari)
//   - total_revenue: nilai garis utama (di-format via formatCurrency)
//   - order_count  : opsional, ditampilkan sebagai info kedua di tooltip
//
// Tooltip kustom neobrutalist: revenue besar + jumlah order.
// Sumbu-Y diformat singkat (1,2jt / 4rb) lewat formatAxisValue.
// ============================================================

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

/**
 * CustomTooltip, tooltip neobrutalist untuk chart.
 * Recharts memanggilnya dengan payload = array titik yang disentuh.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white border-2 border-brand-black px-3 py-2"
      style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
    >
      <p className="text-xs font-black text-brand-black mb-1">{label}</p>
      <p className="text-sm font-black font-mono text-brand-black">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
      {payload[1] && (
        <p className="text-xs text-brand-black/50 font-mono">
          {payload[1].value} order
        </p>
      )}
    </div>
  );
};

// Format angka sumbu-Y biar ringkas: 1.200.000 → "1,2jt", 3.500 → "4rb"
const formatAxisValue = (v) =>
  v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v;

/**
 * SalesChart, grafik garis penjualan mingguan/bulanan.
 *
 * Props:
 *   data : [{ label, total_revenue, order_count? }]
 *          Kalau kosong → placeholder "Belum ada data penjualan".
 */
export default function SalesChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-brand-black/30 text-sm font-semibold">
        Belum ada data penjualan
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="0" stroke="#0A0A0A" strokeOpacity={0.08} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}
          axisLine={{ stroke: "#0A0A0A", strokeWidth: 2 }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatAxisValue}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="total_revenue"
          stroke="#FFE500"
          strokeWidth={3}
          dot={{ r: 5, fill: "#FFE500", stroke: "#0A0A0A", strokeWidth: 2 }}
          activeDot={{ r: 7, fill: "#FFE500", stroke: "#0A0A0A", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
