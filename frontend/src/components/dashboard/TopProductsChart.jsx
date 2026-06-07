"use client";

const BAR_COLORS = ["#FFE500", "#0A0A0A", "#FFE500", "#0A0A0A", "#FFE500"];
const TEXT_COLORS = ["#0A0A0A", "#ffffff",  "#0A0A0A", "#ffffff",  "#0A0A0A"];

export default function TopProductsChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-brand-black/30 text-sm font-semibold">
        Belum ada data produk
      </div>
    );
  }

  const maxQty = Math.max(...data.map((d) => d.qty), 1);

  return (
    <div className="space-y-2.5 py-1">
      {data.map((item, idx) => {
        const pct = Math.round((item.qty / maxQty) * 100);
        const bg  = BAR_COLORS[idx % BAR_COLORS.length];
        const fg  = TEXT_COLORS[idx % TEXT_COLORS.length];
        return (
          <div key={idx} className="flex items-center gap-2 group">
            {/* Rank badge */}
            <span
              className="shrink-0 w-5 h-5 flex items-center justify-center text-[10px] font-black border-2 border-brand-black rounded-sm"
              style={{ backgroundColor: bg, color: fg }}
            >
              {idx + 1}
            </span>

            {/* Bar + name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[11px] font-bold text-brand-black truncate pr-2 leading-tight">
                  {item.name}
                </p>
                <span className="shrink-0 text-[10px] font-black font-mono text-brand-black/60">
                  {item.qty}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full bg-brand-black/8 border border-brand-black/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: bg, border: `1px solid #0A0A0A33` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
