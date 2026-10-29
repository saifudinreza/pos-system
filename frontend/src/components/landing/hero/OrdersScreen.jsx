// ============================================================
// OrdersScreen.jsx, isi layar tablet di hero: daftar pesanan
//
// Tiruan halaman /orders. Pesanan dari mesin POS muncul di paling
// atas (langkah 5 demoFlow.js), menunjukkan satu toko bisa memakai
// banyak layar dengan data yang sama.
// Ukuran memakai em dengan font dasar 2.3cqw. Dekoratif (aria-hidden).
// ============================================================

import { FINAL_STEP, cartAt, rupiah } from "./demoFlow";

const ORDERS = [
  { id: "#024", time: "14.18", items: "Americano, Roti Bakar", total: 30000, status: "Selesai" },
  { id: "#023", time: "14.05", items: "Mie Ayam x2, Es Teh",   total: 40000, status: "Selesai" },
  { id: "#022", time: "13.51", items: "Matcha Latte",          total: 22000, status: "Selesai" },
  { id: "#021", time: "13.40", items: "Nasi Goreng, Kopi Susu", total: 43000, status: "Selesai" },
];

const shadow = { boxShadow: "0.18em 0.18em 0 var(--ink)" };

export default function OrdersScreen({ step = FINAL_STEP }) {
  const fresh = step >= 5;
  const newOrder = { id: "#025", time: "14.32", items: "Kopi Susu x2, Nasi Goreng, Es Teh x2", total: cartAt(FINAL_STEP).total, status: "Lunas" };
  const rows = fresh ? [newOrder, ...ORDERS.slice(0, 3)] : ORDERS;

  return (
    <div aria-hidden="true" className="h-full flex flex-col bg-brand-cream text-brand-black font-grotesk text-[length:2.3cqw] leading-normal select-none">
      <div className="shrink-0 bg-white border-b-[0.15em] border-brand-black px-[1.2em] py-[0.8em] flex items-center justify-between">
        <div>
          <div className="font-bold text-[1.25em] leading-tight">Pesanan</div>
          <div className="text-[0.7em] text-brand-black/50">Hari ini, semua kasir</div>
        </div>
        <span className="bg-brand-yellow border-[0.15em] border-brand-black font-mono font-bold text-[0.75em] px-[0.6em] py-[0.15em]" style={shadow}>
          {fresh ? 25 : 24} order
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-[0.9em] flex flex-col gap-[0.7em]">
        {rows.map((o) => {
          const isNew = o.id === newOrder.id;
          return (
            <div
              key={o.id}
              className={`${isNew ? "hero-slide-in bg-brand-yellow" : "bg-white"} border-[0.15em] border-brand-black px-[0.8em] py-[0.55em] flex items-center gap-[0.8em]`}
              style={shadow}
            >
              <span className="font-mono font-bold text-[0.85em]">{o.id}</span>
              <span className="flex-1 min-w-0 flex flex-col">
                <span className="text-[0.78em] font-bold truncate">{o.items}</span>
                <span className="text-[0.62em] font-mono text-brand-black/50">{o.time} · Kasir Rina</span>
              </span>
              <span className="font-mono font-bold text-[0.8em]">{rupiah(o.total)}</span>
              <span className={`text-[0.6em] font-bold px-[0.6em] py-[0.15em] border-[0.12em] border-brand-black ${isNew ? "bg-success text-white" : "bg-brand-gray"}`}>
                {o.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
