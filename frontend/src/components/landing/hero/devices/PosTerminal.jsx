// ============================================================
// PosTerminal.jsx, mesin POS Android layar ganda (generik, tanpa merek)
//
// Layar utama menghadap kasir di atas leher + alas meja; layar
// pelanggan kecil menghadap ke belakang (kanan). Digambar CSS supaya
// tajam di semua resolusi. Isi layar lewat `children` (komponen UI
// KasirAI asli), layar pelanggan lewat `customer`.
// Ukuran memakai persen lebar perangkat, jadi ikut mengecil di HP.
// ============================================================

export default function PosTerminal({ children, customer, label }) {
  return (
    <div role="img" aria-label={label} className="relative w-full">
      {/* Layar pelanggan (belakang, kanan) */}
      <div
        aria-hidden="true"
        className="absolute -right-[9%] top-[10%] w-[26%] rounded-[8%] border-2 border-brand-black bg-[var(--device-light)] p-[1.6%]"
        style={{ transform: "skewY(7deg)" }}
      >
        <div className="aspect-[1.3/1] overflow-hidden rounded-[6%] bg-brand-black [container-type:inline-size]">
          {customer}
        </div>
      </div>

      {/* Layar utama */}
      <div className="relative z-[1] rounded-[4%/6%] border-2 border-brand-black bg-[var(--device-light)] p-[2.4%] shadow-[inset_0_-0.4em_0_var(--device-light-shade)]">
        <span
          aria-hidden="true"
          className="absolute top-[0.9%] left-1/2 -translate-x-1/2 w-[0.8%] aspect-square rounded-full bg-[var(--device-dark)]"
        />
        <div className="relative aspect-[1.5/1] overflow-hidden rounded-[1.2%/1.8%] border-2 border-brand-black bg-brand-black [container-type:inline-size]">
          {children}
        </div>
      </div>

      {/* Leher + alas */}
      <div aria-hidden="true" className="relative mx-auto -mt-[1%] w-[13%] aspect-[1/0.85] border-x-2 border-brand-black bg-[var(--device-light-shade)]" />
      <div
        aria-hidden="true"
        className="relative mx-auto w-[50%] aspect-[5.2/1] rounded-[0.6em] border-2 border-brand-black bg-[var(--device-light)] shadow-[inset_0_-0.35em_0_var(--device-light-shade)] flex items-center justify-end pr-[8%]"
      >
        {/* Tombol daya */}
        <span className="w-[5%] aspect-square rounded-full border-2 border-brand-black bg-brand-yellow" />
      </div>
    </div>
  );
}
