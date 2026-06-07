"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

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
          tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v}
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
