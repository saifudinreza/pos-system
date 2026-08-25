// NeoCard, Kartu konten neobrutalist
// Analogi: seperti kartu pos, berbatas tebal, bayangan tegas, bersih
// React.memo: kartu dipakai di banyak komponen, memo cegah re-render sia-sia

import { memo } from "react";

/**
 * NeoCard, kartu konten neobrutalist (border tebal + shadow offset).
 *
 * Props:
 *   children : isi kartu
 *   className: class Tailwind tambahan
 *   style    : style inline tambahan (digabung SETELAH shadow bawaan,
 *              jadi bisa di-override sesuai kebutuhan warna kartu)
 *   onClick  : kalau diberikan, kartu jadi bisa diklik,
 *              muncul cursor-pointer + hover "naik" sedikit
 *   noPad    : true → tanpa padding bawaan (p-5), untuk isi yang
 *              butuh kontrol padding sendiri
 */
const NeoCard = memo(function NeoCard({ children, className = "", style = {}, onClick, noPad = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border-2 border-brand-black rounded-md
        ${noPad ? "" : "p-5"}
        ${onClick ? "cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform" : ""}
        ${className}
      `}
      style={{ boxShadow: "4px 4px 0 #0A0A0A", ...style }}
    >
      {children}
    </div>
  );
});

export default NeoCard;
