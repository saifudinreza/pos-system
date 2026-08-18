// NeoButton — Tombol utama neobrutalist
// Analogi: seperti stempel tegas — border jelas, shadow offset, "ditekan" saat klik
// React.memo: cegah re-render kalau props tidak berubah (dipakai di banyak tempat sekaligus)

import { memo } from "react";

// Varian visual tombol — key dipakai sebagai prop `variant` (fallback: primary)
const VARIANTS = {
  primary:   "bg-brand-yellow text-brand-black border-brand-black hover:bg-yellow-300",
  secondary: "bg-white text-brand-black border-brand-black hover:bg-gray-50",
  danger:    "bg-red-500 text-white border-red-600 hover:bg-red-600",
  dark:      "bg-brand-black text-white border-brand-black hover:bg-gray-800",
  ghost:     "bg-transparent text-brand-black border-brand-black/30 hover:border-brand-black",
};

// Ukuran tombol — key dipakai sebagai prop `size` (fallback: md)
const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

/**
 * NeoButton — tombol utama neobrutalist (border tebal + shadow offset "ditekan").
 *
 * Props:
 *   children : isi tombol (teks/ikon)
 *   variant  : primary|secondary|danger|dark|ghost (default: primary)
 *   size     : sm|md|lg (default: md)
 *   className: class Tailwind tambahan
 *   disabled : true → transparan 50%, cursor-not-allowed, tanpa shadow
 *   type     : atribut `type` (default: "button" — aman di dalam form)
 *   onClick  : handler klik
 *   ...props : diteruskan ke <button> (mis. aria-label, title)
 */
const NeoButton = memo(function NeoButton({
  children, variant = "primary", size = "md",
  className = "", disabled = false, type = "button",
  onClick, ...props
}) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-bold border-2
        transition-all duration-100 select-none
        ${VARIANTS[variant] ?? VARIANTS.primary}
        ${SIZES[size] ?? SIZES.md}
        ${disabled ? "opacity-50 cursor-not-allowed shadow-none" : "cursor-pointer"}
        ${className}
      `}
      style={!disabled ? { boxShadow: "3px 3px 0 #0A0A0A" } : undefined}
      {...props}
    >
      {children}
    </button>
  );
});

export default NeoButton;
