// ============================================================
// LogoMark — Ikon brand KasirAI (huruf "K" + ekor chat bubble)
//
// Analogi: ini "wajah" brand — kotak kuning neobrutalist berisi
// huruf K, dengan takik di pojok kanan bawah yang membuatnya
// terbaca seperti balon chat (isyarat sisi AI-nya).
//
// Dibuat sebagai SVG vektor (bukan file gambar) supaya:
//  - tajam di semua ukuran (favicon kecil s/d hero besar)
//  - ringan, tanpa request gambar
//  - warna brand konsisten di latar terang maupun gelap
//
// Dipakai di: LandingNavbar, Sidebar, login, register, footer,
// kasir layout — menggantikan kotak "K" versi CSS lama.
// ============================================================

// Warna brand (dikunci agar konsisten di mana pun dipakai)
const YELLOW = "#FFE500"; // brand-yellow
const BLACK  = "#0A0A0A"; // brand-black

export default function LogoMark({ size = 36, className = "", title = "KasirAI", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
      {...props}
    >
      <title>{title}</title>

      {/* Badan ikon: kotak membulat dengan takik "balon chat" di kanan bawah.
          Satu path: isi kuning + garis tepi hitam tebal (khas neobrutalism). */}
      <path
        d="M8 31 Q8 8 31 8 L69 8 Q92 8 92 31 L92 73 L73 73 L73 92 L31 92 Q8 92 8 69 Z"
        fill={YELLOW}
        stroke={BLACK}
        strokeWidth="8"
        strokeLinejoin="round"
      />

      {/* Huruf "K" tebal — digambar sebagai path agar tetap tajam
          dan tidak bergantung pada font yang ter-load. */}
      <path
        d="M28 28 L40 28 L40 44 L53 28 L67 28 L51 50 L69 72 L55 72 L40 56 L40 72 L28 72 Z"
        fill={BLACK}
      />
    </svg>
  );
}
