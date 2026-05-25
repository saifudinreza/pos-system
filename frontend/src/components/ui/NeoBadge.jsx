// NeoBadge — Label status kecil neobrutalist
// Analogi: seperti stiker warna di rak toko — tiap warna punya arti (merah=habis, hijau=tersedia)

const COLORS = {
  yellow:  "bg-brand-yellow text-brand-black border-brand-black",
  black:   "bg-brand-black text-white border-brand-black",
  green:   "bg-green-100 text-green-800 border-green-600",
  red:     "bg-red-100 text-red-700 border-red-500",
  gray:    "bg-gray-100 text-gray-600 border-gray-400",
  blue:    "bg-blue-100 text-blue-700 border-blue-500",
  orange:  "bg-orange-100 text-orange-700 border-orange-500",
};

export default function NeoBadge({ children, color = "yellow", className = "" }) {
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
}
