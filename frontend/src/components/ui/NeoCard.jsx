// NeoCard, Kartu konten neobrutalist (SATU definisi untuk landing & dashboard)
// Analogi: seperti kartu pos, berbatas tebal, bayangan tegas, bersih
// React.memo: kartu dipakai di banyak komponen, memo cegah re-render sia-sia
//
// Sudut sengaja TEGAS (tanpa radius) agar sama dengan landing page dan layar kasir.

import { memo } from "react";

// Varian warna. Key dipakai sebagai prop `variant` (fallback: default)
const VARIANTS = {
  default:   "bg-white text-brand-black",
  highlight: "bg-brand-yellow text-brand-black",
  dark:      "bg-brand-black text-white",
};

// Ukuran: md = kartu dashboard (border 2px, shadow 4px), lg = kartu landing (border 3px, shadow 6px)
// Bayangan terpisah per warna; kartu gelap memakai bayangan kuning agar tidak hilang di latar gelap.
const BORDER = { md: "border-2", lg: "border-3" };
const SHADOW = {
  ink:    { md: "shadow-[4px_4px_0_var(--ink)]",    lg: "shadow-[6px_6px_0_var(--ink)]" },
  yellow: { md: "shadow-[4px_4px_0_var(--yellow)]", lg: "shadow-[6px_6px_0_var(--yellow)]" },
};

/**
 * NeoCard, kartu konten neobrutalist (border tebal + shadow offset).
 *
 * Props:
 *   children : isi kartu
 *   variant  : default|highlight|dark (default: default)
 *   size     : md|lg (default: md)
 *   className: class Tailwind tambahan
 *   style    : style inline tambahan (digabung SETELAH shadow bawaan,
 *              jadi bisa di-override sesuai kebutuhan warna kartu)
 *   onClick  : kalau diberikan, kartu jadi bisa diklik,
 *              muncul cursor-pointer + hover "naik" sedikit
 *   noPad    : true → tanpa padding bawaan (p-5), untuk isi yang
 *              butuh kontrol padding sendiri
 */
const NeoCard = memo(function NeoCard({
  children, variant = "default", size = "md", className = "", style = {}, onClick, noPad = false,
}) {
  const sz = BORDER[size] ? size : "md";
  const shadow = SHADOW[variant === "dark" ? "yellow" : "ink"][sz];
  return (
    <div
      onClick={onClick}
      className={[
        "border-brand-black",
        VARIANTS[variant] ?? VARIANTS.default,
        BORDER[sz],
        shadow,
        noPad ? "" : (sz === "lg" ? "p-6" : "p-5"),
        onClick ? "cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform" : "",
        className,
      ].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </div>
  );
});

export default NeoCard;
