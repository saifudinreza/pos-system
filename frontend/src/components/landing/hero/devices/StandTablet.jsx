// ============================================================
// StandTablet.jsx, tablet landscape di stand meja logam (generik)
//
// Bingkai gelap + lengan stand + alas persegi. Isi layar lewat
// `children`. Ukuran memakai persen lebar perangkat.
// ============================================================

export default function StandTablet({ children, label }) {
  return (
    <div role="img" aria-label={label} className="relative w-full">
      {/* Tablet */}
      <div className="relative z-[1] rounded-[4.5%/6.5%] border-2 border-brand-black bg-[var(--device-dark)] p-[3%]">
        <span
          aria-hidden="true"
          className="absolute top-[1.4%] left-1/2 -translate-x-1/2 w-[1%] aspect-square rounded-full bg-[var(--device-dark-shade)]"
        />
        <div className="relative aspect-[1.45/1] overflow-hidden rounded-[1.6%/2.3%] bg-brand-cream [container-type:inline-size]">
          {children}
        </div>
      </div>

      {/* Lengan stand */}
      <div aria-hidden="true" className="relative mx-auto -mt-[4%] w-[12%] aspect-[1/1.3] border-2 border-brand-black bg-[var(--device-metal)] rounded-b-[0.3em]" />
      {/* Alas */}
      <div aria-hidden="true" className="relative mx-auto -mt-[1%] w-[46%] aspect-[6/1] rounded-[0.5em] border-2 border-brand-black bg-[var(--device-metal)] shadow-[inset_0_-0.3em_0_var(--device-metal-shade)]" />
    </div>
  );
}
