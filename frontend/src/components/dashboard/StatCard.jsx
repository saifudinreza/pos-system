// StatCard — Kartu statistik ringkasan di dashboard
// Analogi: seperti papan skor di lapangan — angka besar yang langsung terlihat

import NeoCard from "@/components/ui/NeoCard";

const BG_STYLE = {
  yellow: { backgroundColor: "#FFE500", color: "#0A0A0A" },
  black:  { backgroundColor: "#0A0A0A", color: "#ffffff" },
  white:  { backgroundColor: "#ffffff", color: "#0A0A0A" },
  green:  { backgroundColor: "#dcfce7", color: "#0A0A0A" },
  orange: { backgroundColor: "#ffedd5", color: "#0A0A0A" },
};

export default function StatCard({ label, value, sub, icon, color = "yellow", trend }) {
  const bgStyle = BG_STYLE[color] ?? BG_STYLE.white;

  return (
    <NeoCard className="flex flex-col gap-3 h-full" style={bgStyle}>
      {/* Baris atas: label + ikon */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest opacity-60 font-mono">{label}</p>
        {icon && <span className="text-2xl leading-none">{icon}</span>}
      </div>

      {/* Angka utama */}
      <p className="text-xl sm:text-2xl font-black font-mono leading-tight break-words overflow-hidden">{value}</p>

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
