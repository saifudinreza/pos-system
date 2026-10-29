// ============================================================
// LiveTicker.jsx, kartu "aktivitas langsung" di atas meja kuning hero
//
// Menceritakan langkah demoFlow.js yang sedang tampil di tiga layar
// (tambah item → bayar → struk WA → laporan), plus titik progres.
// Ditandai "SIMULASI" supaya jujur: ini demo, bukan data pengguna.
// Dekoratif (aria-hidden): isi perangkat sudah dijelaskan aria-label.
// ============================================================

import { CheckCircle2, MessageCircle, ShoppingCart, TrendingUp } from "lucide-react";
import { STEP_COUNT, cartAt, rupiah } from "./demoFlow";

const total = rupiah(cartAt(STEP_COUNT - 1).total);

const EVENTS = [
  { icon: ShoppingCart,  tone: "bg-brand-yellow", title: "Kopi Susu Gula Aren x2",      sub: "masuk keranjang di mesin POS" },
  { icon: ShoppingCart,  tone: "bg-brand-yellow", title: "Nasi Goreng Spesial",         sub: "ditambahkan kasir" },
  { icon: ShoppingCart,  tone: "bg-brand-yellow", title: `Total ${total}`,              sub: "5 item, PPN dihitung otomatis" },
  { icon: CheckCircle2,  tone: "bg-success text-white", title: `Lunas via QRIS`,        sub: `${total} diterima` },
  { icon: MessageCircle, tone: "bg-success text-white", title: "Struk terkirim ke WhatsApp", sub: "pelanggan langsung terima" },
  { icon: TrendingUp,    tone: "bg-brand-black text-brand-yellow", title: "Laporan & stok ter-update", sub: "pemilik pantau dari HP" },
];

export default function LiveTicker({ step, className = "" }) {
  const e = EVENTS[step] ?? EVENTS[EVENTS.length - 1];
  const Icon = e.icon;

  return (
    <div
      aria-hidden="true"
      className={`bg-white border-[3px] border-brand-black font-grotesk text-brand-black ${className}`}
      style={{ boxShadow: "5px 5px 0 var(--ink)" }}
    >
      <div className="flex items-center justify-between border-b-2 border-brand-black bg-brand-black px-3 py-1">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-white">
          <span className="hero-live-dot w-2 h-2 rounded-full bg-danger" />
          AKTIVITAS TOKO
        </span>
        <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-white/60">SIMULASI</span>
      </div>

      <div key={step} className="hero-slide-in flex items-center gap-3 px-3 py-2.5">
        <span className={`w-9 h-9 shrink-0 border-2 border-brand-black flex items-center justify-center ${e.tone}`}>
          <Icon size={18} strokeWidth={2.5} />
        </span>
        <span className="min-w-0 flex flex-col">
          <span className="text-sm font-bold leading-tight truncate">{e.title}</span>
          <span className="text-xs text-brand-black/60 leading-tight truncate">{e.sub}</span>
        </span>
      </div>

      {/* Progres alur: satu segmen per langkah */}
      <div className="flex gap-1 px-3 pb-2.5">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 border border-brand-black transition-colors duration-300 ${i <= step ? "bg-brand-yellow" : "bg-brand-gray"}`}
          />
        ))}
      </div>
    </div>
  );
}
