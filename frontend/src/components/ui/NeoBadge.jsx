// NeoBadge, Label status kecil neobrutalist
// Analogi: seperti stiker warna di rak toko, tiap warna punya arti (merah=habis, hijau=tersedia)
// React.memo: dipakai di setiap baris tabel, memo mencegah re-render yang tidak perlu

import { memo } from "react";

// Palet warna badge, key dipakai sebagai prop `color`, value = class Tailwind
// (warna teks/background/border sudah dipasangkan per varian)
const COLORS = {
  yellow:  "bg-brand-yellow text-brand-black border-brand-black",
  black:   "bg-brand-black text-white border-brand-black",
  // Warna semantik (token): teks tetap hitam supaya kontras aman di latar tint
  success: "bg-success/15 text-brand-black border-success",
  danger:  "bg-danger/15 text-brand-black border-danger",
  warning: "bg-warning/20 text-brand-black border-warning",
  info:    "bg-info/10 text-brand-black border-info",
  gray:    "bg-brand-gray text-brand-black/70 border-brand-black/30",
  // Alias nama lama (dipakai di banyak halaman, jangan dihapus)
  green:   "bg-success/15 text-brand-black border-success",
  red:     "bg-danger/15 text-brand-black border-danger",
  blue:    "bg-info/10 text-brand-black border-info",
  orange:  "bg-warning/20 text-brand-black border-warning",
};

/**
 * NeoBadge, label status kecil neobrutalist (stiker warna di rak toko).
 *
 * Props:
 *   children : teks isi badge
 *   color    : key dari COLORS, yellow|black|success|danger|warning|info|gray (alias lama: green|red|blue|orange)
 *              (kalau tidak dikenal → fallback gray)
 *   className: class Tailwind tambahan, ditempel di paling akhir
 */
const NeoBadge = memo(function NeoBadge({ children, color = "yellow", className = "" }) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5
        border text-[11px] font-black uppercase tracking-wider
        ${COLORS[color] ?? COLORS.gray}
        ${className}
      `}
    >
      {children}
    </span>
  );
});

export default NeoBadge;
