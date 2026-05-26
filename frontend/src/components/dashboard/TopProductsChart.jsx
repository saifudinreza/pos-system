"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white border-2 border-brand-black px-3 py-2"
      style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
    >
      <p className="text-xs font-black text-brand-black mb-1">{label}</p>
      <p className="text-sm font-black font-mono">{payload[0]?.value} terjual</p>
    </div>
  );
};

export default function TopProductsChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-brand-black/30 text-sm font-semibold">
        Belum ada data produk
      </div>
    );
  }

  const BAR_COLORS = ["#FFE500", "#0A0A0A", "#FFE500", "#0A0A0A", "#FFE500"];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="0" stroke="#0A0A0A" strokeOpacity={0.08} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fontWeight: 600, fill: "#0A0A0A" }}
          axisLine={{ stroke: "#0A0A0A", strokeWidth: 2 }}
          tickLine={false}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#FFE500", fillOpacity: 0.2 }} />
        <Bar dataKey="qty" stroke="#0A0A0A" strokeWidth={2} radius={0}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
