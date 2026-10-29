// ============================================================
// CustomerScreen.jsx, layar pelanggan kecil di belakang mesin POS
//
// Menampilkan total belanja yang sama dengan layar kasir, lalu
// "Terima kasih" setelah lunas. Font dasar 7cqw. Dekoratif.
// ============================================================

import { FINAL_STEP, cartAt, rupiah } from "./demoFlow";

export default function CustomerScreen({ step = FINAL_STEP }) {
  const cart = cartAt(step);

  return (
    <div aria-hidden="true" className="h-full flex flex-col items-center justify-center gap-[0.3em] bg-brand-black text-white font-grotesk text-[length:7cqw] leading-tight select-none">
      <span className="font-mono text-[0.7em] text-white/60 tracking-[0.15em]">{cart.paid ? "LUNAS" : "TOTAL"}</span>
      <span key={cart.total} className="hero-pop font-mono font-bold text-[1.25em] text-brand-yellow">{rupiah(cart.total)}</span>
      <span className="text-[0.65em] text-white/70">{cart.paid ? "Terima kasih!" : `${cart.qty} item`}</span>
    </div>
  );
}
