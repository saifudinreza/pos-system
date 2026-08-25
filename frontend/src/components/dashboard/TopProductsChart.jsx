"use client";

// ============================================================
// TopProductsChart, daftar produk terlaris dengan bar proporsional
//
// Props: data = [{ name, qty }], produk + jumlah terjual.
//
// Bar dihitung persen terhadap produk dengan qty TERBESAR (maxQty),
// jadi bar tertinggi selalu 100% dan sisanya menyesuaikan.
// Warna bar & teks rank selang-seling kuning/hitam (neobrutalist).
// ============================================================

// Palet warna bar, di-akses dengan modulo index (idx % panjang)
const BAR_COLORS = ["#FFE500", "#0A0A0A", "#FFE500", "#0A0A0A", "#FFE500"];
const TEXT_COLORS = ["#0A0A0A", "#ffffff",  "#0A0A0A", "#ffffff",  "#0A0A0A"];

/**
 * TopProductsChart, bar chart produk terlaris (CSS murni, tanpa library).
 *
 * Props:
 *   data : [{ name, qty }], kalau kosong → placeholder "Belum ada data produk"
 */
export default function TopProductsChart({ data = [] }) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-brand-black/30 text-sm font-semibold">
        Belum ada data produk
      </div>
    );
  }

  // Qty terbesar jadi patokan 100%, di-beri minimum 1 agar tidak bagi nol
  const maxQty = Math.max(...data.map((product) => product.qty), 1);

  return (
    <div className="space-y-2.5 py-1">
      {data.map((item, idx) => {
        // Lebar bar relatif terhadap produk terlaris
        const pct = Math.round((item.qty / maxQty) * 100);
        // Warna selang-seling per peringkat (kuning, hitam, kuning, ...)
        const barBg  = BAR_COLORS[idx % BAR_COLORS.length];
        const barFg  = TEXT_COLORS[idx % TEXT_COLORS.length];
        return (
          <div key={idx} className="flex items-center gap-2 group">
            {/* Rank badge */}
            <span
              className="shrink-0 w-5 h-5 flex items-center justify-center text-[10px] font-black border-2 border-brand-black rounded-sm"
              style={{ backgroundColor: barBg, color: barFg }}
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
              {/* Progress bar, lebar = pct, warna ikut palet peringkat */}
              <div className="h-2 w-full bg-brand-black/8 border border-brand-black/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: barBg, border: `1px solid #0A0A0A33` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
