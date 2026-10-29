// ============================================================
// Phone.jsx, smartphone modern (generik, tanpa merek)
//
// Rangka gelap bersudut bulat, kamera punch-hole di tengah atas,
// tombol samping. Isi layar lewat `children`.
// ============================================================

export default function Phone({ children, label }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="relative w-full rounded-[16%/7.6%] border-2 border-brand-black bg-[var(--device-dark)] p-[4.5%]"
    >
      <span aria-hidden="true" className="absolute -right-[3%] top-[20%] w-[3%] h-[10%] rounded-r-[3px] border-2 border-l-0 border-brand-black bg-[var(--device-dark)]" />
      <span aria-hidden="true" className="absolute -right-[3%] top-[33%] w-[3%] h-[6%] rounded-r-[3px] border-2 border-l-0 border-brand-black bg-[var(--device-dark)]" />
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[12%/5.5%] bg-brand-gray [container-type:inline-size]">
        <span aria-hidden="true" className="absolute z-[3] top-[1.5%] left-1/2 -translate-x-1/2 w-[5.5%] aspect-square rounded-full bg-[var(--device-dark)]" />
        {children}
      </div>
    </div>
  );
}
