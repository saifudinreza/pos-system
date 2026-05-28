"use client";

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const METHOD_LABELS = {
  cash:          "Tunai",
  qris:          "QRIS",
  bank_transfer: "Transfer Bank",
  credit_card:   "Kartu Kredit",
  gopay:         "GoPay",
  ovo:           "OVO",
  dana:          "DANA",
  other:         "Lainnya",
};

const PIE_COLORS = ["#FFE500", "#0A0A0A", "#6B7280", "#10B981", "#F59E0B", "#EF4444"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      className="bg-white border-2 border-brand-black px-3 py-2"
      style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
    >
      <p className="text-xs font-black text-brand-black mb-1">{d.name}</p>
      <p className="text-sm font-black font-mono">{d.value} transaksi</p>
      <p className="text-xs text-brand-black/50 font-mono">{formatCurrency(d.payload.total)}</p>
    </div>
  );
};

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.07) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y} fill="#0A0A0A"
      textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight="900" fontFamily="JetBrains Mono, monospace"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PaymentMethodChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="h-[220px] flex items-center justify-center text-brand-black/30 text-sm font-semibold">
        Belum ada data pembayaran
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name:  METHOD_LABELS[d.method] ?? d.method,
    value: d.count,
    total: d.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={82}
          dataKey="value"
          strokeWidth={2}
          stroke="#0A0A0A"
          labelLine={false}
          label={renderLabel}
        >
          {chartData.map((_, idx) => (
            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="rect"
          iconSize={10}
          formatter={(value) => (
            <span style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
