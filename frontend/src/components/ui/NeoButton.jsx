// NeoButton, Tombol neobrutalist (SATU definisi untuk landing & dashboard)
// Analogi: seperti stempel tegas, border jelas, shadow offset, "ditekan" saat klik
// React.memo: cegah re-render kalau props tidak berubah (dipakai di banyak tempat sekaligus)
//
// Aturan pakai (lihat frontend/DESIGN_SYSTEM.md):
//   - SATU tombol utama per layar: `cta` (latar terang) atau `inverse` (latar gelap)
//   - Aksi pendukung: `secondary`; aksi pasif/ringan: `ghost`
//   - `primary` (kuning) untuk aksi utama di dalam aplikasi (kasir, form, tabel)
//   - `danger` hanya untuk aksi merusak (hapus, batalkan)
// Untuk tautan (<Link>) pakai neoButtonClass() supaya tampilannya identik.

import { memo } from "react";

// Varian visual (warna). Key dipakai sebagai prop `variant` (fallback: primary)
const VARIANTS = {
  primary:      "bg-brand-yellow text-brand-black border-brand-black hover:bg-brand-yellow/80",
  secondary:    "bg-white text-brand-black border-brand-black hover:bg-brand-yellow/40",
  dark:         "bg-brand-black text-white border-brand-black hover:bg-brand-black/85",
  cta:          "bg-brand-black text-white border-brand-black hover:bg-brand-black/90",
  inverse:      "bg-brand-yellow text-brand-black border-brand-yellow hover:bg-brand-yellow/90",
  outlineLight: "bg-transparent text-white border-white/60 hover:border-white hover:bg-white/10",
  danger:       "bg-danger text-white border-brand-black hover:bg-danger/90",
  ghost:        "bg-transparent text-brand-black border-brand-black/30 hover:border-brand-black",
};

// Warna bayangan per varian (key ke SHADOWS)
const SHADOW_COLOR = {
  primary: "ink", secondary: "ink", dark: "ink", danger: "ink",
  cta: "yellow", inverse: "yellow",
  outlineLight: "none", ghost: "none",
};

// Daftar LITERAL supaya Tailwind JIT mengenali semua class (jangan disusun dinamis)
const SHADOWS = {
  ink: {
    sm: "shadow-[2px_2px_0_var(--ink)]",
    md: "shadow-[3px_3px_0_var(--ink)]",
    lg: "shadow-[4px_4px_0_var(--ink)]",
    xl: "shadow-[5px_5px_0_var(--ink)]",
  },
  yellow: {
    sm: "shadow-[2px_2px_0_var(--yellow)]",
    md: "shadow-[3px_3px_0_var(--yellow)]",
    lg: "shadow-[4px_4px_0_var(--yellow)]",
    xl: "shadow-[5px_5px_0_var(--yellow)]",
  },
  none: { sm: "", md: "", lg: "", xl: "" },
};

// Ukuran tombol, key dipakai sebagai prop `size` (fallback: md)
const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  xl: "px-7 py-4 text-lg",
};

/**
 * neoButtonClass, susun class tombol (dipakai NeoButton dan <Link> bergaya tombol).
 * @param {{variant?:string,size?:string,disabled?:boolean,className?:string}} opts
 */
export function neoButtonClass({ variant = "primary", size = "md", disabled = false, className = "" } = {}) {
  const v = VARIANTS[variant] ? variant : "primary";
  const s = SIZES[size] ? size : "md";
  const shadow = SHADOWS[SHADOW_COLOR[v]][s];
  return [
    "inline-flex items-center justify-center gap-2 font-bold border-2 select-none",
    "transition-all duration-100",
    "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-brand-black",
    VARIANTS[v],
    SIZES[s],
    disabled
      ? "opacity-50 cursor-not-allowed"
      : `cursor-pointer ${shadow} active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`,
    className,
  ].filter(Boolean).join(" ");
}

/**
 * NeoButton, tombol neobrutalist (border tebal + shadow offset "ditekan").
 *
 * Props:
 *   children : isi tombol (teks/ikon)
 *   variant  : primary|secondary|dark|cta|inverse|outlineLight|danger|ghost (default: primary)
 *   size     : sm|md|lg|xl (default: md)
 *   loading  : true → tampil spinner, tombol dinonaktifkan, aria-busy
 *   className: class Tailwind tambahan
 *   disabled : true → transparan 50%, cursor-not-allowed, tanpa shadow
 *   type     : atribut `type` (default: "button", aman di dalam form)
 *   onClick  : handler klik
 *   ...props : diteruskan ke <button> (mis. aria-label, title)
 */
const NeoButton = memo(function NeoButton({
  children, variant = "primary", size = "md",
  className = "", disabled = false, loading = false, type = "button",
  onClick, ...props
}) {
  const off = disabled || loading;
  return (
    <button
      type={type} onClick={onClick} disabled={off}
      aria-busy={loading || undefined}
      className={neoButtonClass({ variant, size, disabled: off, className })}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {children}
    </button>
  );
});

export default NeoButton;
