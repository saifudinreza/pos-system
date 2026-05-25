// StatCard — Kartu statistik ringkasan di dashboard
// Analogi: seperti papan skor di lapangan — angka besar yang langsung terlihat

import NeoCard from "@/components/ui/NeoCard";

export default function StatCard({ label, value, sub, icon, color = "yellow", trend }) {
  const COLORS = {
    yellow: "bg-brand-yellow",
    black:  "bg-brand-black text-white",
    white:  "bg-white",
    green:  "bg-green-100",
  };

  return (
    <NeoCard className={`${COLORS[color]} flex flex-col gap-3`}>
      {/* Baris atas: label + ikon */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest opacity-60 font-mono">{label}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>

      {/* Angka utama */}
      <p className="text-3xl font-black font-mono leading-none">{value}</p>

      {/* Sub-info + tren */}
      {(sub || trend) && (
        <div className="flex items-center gap-2">
          {sub && <p className="text-xs font-semibold opacity-60">{sub}</p>}
          {trend !== undefined && (
            <span className={`text-xs font-black ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
            </span>
          )}
        </div>
      )}
    </NeoCard>
  );
}
