"use client";

// ============================================================
// HeroProductPreview, tampilan produk di hero (menggantikan foto AI)
//
// Empat "layar" contoh yang mengikuti tampilan aplikasi asli:
// Kasir, Struk WhatsApp, Laporan, dan AI Assistant. Berganti otomatis
// tiap beberapa detik, berhenti saat disorot/difokus, dan bisa dipilih
// lewat tab (keyboard friendly). Data toko "Kopi Senja" adalah CONTOH
// dan diberi label jelas supaya tidak dikira data nyata.
// ============================================================

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const TABS = [
  { id: "kasir", label: "Kasir", url: "sikasirai.com/kasir" },
  { id: "struk", label: "Struk WhatsApp", url: "sikasirai.com/kasir" },
  { id: "laporan", label: "Laporan", url: "sikasirai.com/reports" },
  { id: "ai", label: "AI Assistant", url: "sikasirai.com/dashboard" },
];

const rp = (n) => "Rp " + n.toLocaleString("id-ID");

// ---------- Panel 1: Kasir ----------
const PRODUCTS = [
  { emoji: "🧋", name: "Es Kopi Susu", price: 18000, qty: 2 },
  { emoji: "☕", name: "Americano", price: 15000 },
  { emoji: "🍵", name: "Matcha Latte", price: 22000 },
  { emoji: "🥐", name: "Croissant", price: 16000, qty: 1 },
  { emoji: "🍞", name: "Roti Bakar", price: 14000 },
  { emoji: "💧", name: "Air Mineral", price: 5000 },
];

function KasirPanel() {
  return (
    <div className="flex flex-col sm:flex-row h-full">
      <div className="flex-1 p-3 grid grid-cols-2 gap-2.5 content-start">
        {PRODUCTS.map((p) => (
          <div
            key={p.name}
            className={`relative border-2 border-brand-black p-2.5 ${p.qty ? "bg-brand-yellow" : "bg-white"}`}
            style={{ boxShadow: "2px 2px 0 var(--ink)" }}
          >
            {p.qty && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-black text-white text-xs font-mono font-bold flex items-center justify-center">
                {p.qty}
              </span>
            )}
            <div className="text-3xl leading-none text-center mb-1">{p.emoji}</div>
            <div className="font-grotesk font-bold text-[13px] leading-tight">{p.name}</div>
            <div className="font-mono font-bold text-[12px]">{rp(p.price)}</div>
          </div>
        ))}
      </div>
      <div className="sm:w-[46%] border-t-2 sm:border-t-0 sm:border-l-2 border-brand-black bg-white p-3 flex flex-col text-[12px]">
        <div className="font-grotesk font-black text-sm mb-2">Keranjang</div>
        <div className="space-y-1.5 flex-1 font-mono">
          <div className="flex justify-between"><span>2× Es Kopi Susu</span><span>{rp(36000)}</span></div>
          <div className="flex justify-between"><span>1× Croissant</span><span>{rp(16000)}</span></div>
        </div>
        <div className="border-t-2 border-brand-black mt-2 pt-2 font-mono space-y-0.5">
          <div className="flex justify-between"><span>Subtotal</span><span>{rp(52000)}</span></div>
          <div className="flex justify-between"><span>PPN 11%</span><span>{rp(5720)}</span></div>
          <div className="flex justify-between font-bold text-[13px]"><span>Total</span><span>{rp(57720)}</span></div>
        </div>
        <div className="mt-2.5 bg-brand-yellow border-2 border-brand-black text-center font-grotesk font-black py-1.5" style={{ boxShadow: "2px 2px 0 var(--ink)" }}>
          Bayar Tunai
        </div>
        <div className="mt-2 bg-brand-black text-white border-2 border-brand-black text-center font-grotesk font-bold py-1.5">
          Bayar Digital (QRIS)
        </div>
      </div>
    </div>
  );
}

// ---------- Panel 2: Struk + WhatsApp ----------
function StrukPanel() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 h-full p-4">
      <div className="w-full sm:w-[48%] bg-white border-2 border-brand-black p-3 font-mono text-[12px]" style={{ boxShadow: "3px 3px 0 var(--ink)" }}>
        <div className="text-center font-grotesk font-black text-sm">Kopi Senja</div>
        <div className="text-center text-[10px] opacity-60 mb-1.5">Struk Digital</div>
        <div className="border-t border-dashed border-brand-black my-1.5" />
        <div className="flex justify-between"><span>2× Es Kopi Susu</span><span>36.000</span></div>
        <div className="flex justify-between"><span>1× Croissant</span><span>16.000</span></div>
        <div className="border-t border-dashed border-brand-black my-1.5" />
        <div className="flex justify-between"><span>PPN 11%</span><span>5.720</span></div>
        <div className="flex justify-between font-bold"><span>Total</span><span>{rp(57720)}</span></div>
        <div className="mt-2 -rotate-2 text-center bg-success border-2 border-brand-black font-grotesk font-black py-0.5">LUNAS</div>
      </div>
      <div className="flex sm:flex-col items-center gap-2">
        <span className="font-grotesk font-black text-2xl rotate-90 sm:rotate-0" aria-hidden="true">→</span>
      </div>
      <div className="w-full sm:w-[42%]">
        <div className="bg-[#128C7E] text-white px-3 py-2 font-grotesk font-bold text-[13px]">
          Kopi Senja <span className="font-medium opacity-80 text-[10px]">· akun bisnis</span>
        </div>
        <div className="bg-[#E6DDD4] p-3 border-2 border-t-0 border-brand-black">
          <div className="bg-white border border-brand-black/40 p-2.5 text-[11px] font-mono leading-snug">
            <b>Struk Digital · Kopi Senja</b>
            <br />2× Es Kopi Susu · 1× Croissant
            <br />Total : {rp(57720)}
            <br />Status : LUNAS ✓
            <br />Terima kasih! ☕
          </div>
          <div className="mt-2 text-[10px] font-mono opacity-60">Terkirim otomatis ke WhatsApp pelanggan</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Panel 3: Laporan ----------
const TREND = [
  ["Sen", 1850], ["Sel", 2120], ["Rab", 1760], ["Kam", 2390], ["Jum", 2840], ["Sab", 3410], ["Min", 3105],
];

function LaporanPanel() {
  const max = 3600;
  return (
    <div className="p-3 h-full flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5">
        {[
          ["Pendapatan 7 hari", "Rp 17,5 jt", "bg-brand-yellow"],
          ["Laba kotor", "Rp 8,6 jt", "bg-success"],
          ["Margin laba", "49,1%", "bg-white"],
        ].map(([k, v, bg]) => (
          <div key={k} className={`${bg} border-2 border-brand-black p-2`} style={{ boxShadow: "2px 2px 0 var(--ink)" }}>
            <div className="font-mono text-[9px] uppercase tracking-wider opacity-70 leading-tight">{k}</div>
            <div className="font-mono font-bold text-[15px] leading-tight mt-0.5">{v}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-[150px] bg-white border-2 border-brand-black p-3 flex flex-col">
        <div className="font-grotesk font-black text-[13px] mb-2">Tren Penjualan</div>
        <div className="flex-1 flex items-end gap-2">
          {TREND.map(([d, v]) => (
            <div key={d} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className="w-full bg-brand-yellow border-2 border-brand-black"
                style={{ height: `${(v / max) * 100}%` }}
              />
              <span className="font-mono text-[10px] mt-1">{d}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 text-[11px] font-grotesk font-bold">
        <span className="border-2 border-brand-black bg-white px-2 py-0.5">⬇ PDF</span>
        <span className="border-2 border-brand-black bg-white px-2 py-0.5">⬇ Excel</span>
      </div>
    </div>
  );
}

// ---------- Panel 4: AI ----------
function AIPanel() {
  return (
    <div className="p-3 h-full flex flex-col gap-3 bg-brand-cream">
      <div className="self-end max-w-[85%] bg-brand-yellow border-2 border-brand-black px-3 py-2 font-grotesk font-bold text-[13px]">
        Produk apa yang paling laku minggu ini?
      </div>
      <div className="self-start max-w-[92%] bg-white border-2 border-brand-black px-3 py-2 text-[12.5px] leading-snug font-medium">
        <b>Es Kopi Susu</b> paling laku minggu ini: <b>186 gelas</b> terjual dengan omzet Rp 3,35 juta. Disusul Croissant (124 pcs).
        <br />Stok Croissant tinggal <b className="text-warning">18</b>, sebaiknya segera restock.
      </div>
      <div className="self-end max-w-[85%] bg-brand-yellow border-2 border-brand-black px-3 py-2 font-grotesk font-bold text-[13px]">
        Berapa laba kotor minggu ini?
      </div>
      <div className="self-start max-w-[92%] bg-white border-2 border-brand-black px-3 py-2 text-[12.5px] leading-snug font-medium">
        Laba kotor minggu ini <b>Rp 8,59 juta</b> dengan margin <b>49,1%</b>.
      </div>
    </div>
  );
}

const PANELS = { kasir: KasirPanel, struk: StrukPanel, laporan: LaporanPanel, ai: AIPanel };

/**
 * HeroProductPreview, jendela aplikasi contoh dengan 4 tab.
 * Tanpa props. Auto-ganti tab tiap 5 detik kecuali sedang disorot/difokus
 * atau pengguna memilih mengurangi animasi.
 */
export default function HeroProductPreview() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => setActive((a) => (a + 1) % TABS.length), 5000);
    return () => clearInterval(t);
  }, [paused, reduce]);

  const Panel = PANELS[TABS[active].id];

  return (
    <div
      className="w-full max-w-[640px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="bg-brand-cream border-[3px] border-brand-black"
        style={{ boxShadow: "8px 8px 0 var(--ink)" }}
      >
        {/* Bilah judul jendela */}
        <div className="bg-brand-yellow border-b-[3px] border-brand-black px-3 py-2 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-danger border border-brand-black" />
          <span className="w-3 h-3 rounded-full bg-warning border border-brand-black" />
          <span className="w-3 h-3 rounded-full bg-success border border-brand-black" />
          <span className="ml-2 flex-1 bg-white border-2 border-brand-black font-mono text-[11px] px-2 py-0.5 truncate">
            {TABS[active].url}
          </span>
        </div>

        {/* Tab */}
        <div role="tablist" aria-label="Contoh tampilan aplikasi" className="flex border-b-2 border-brand-black bg-white overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`flex-1 whitespace-nowrap px-3 py-2 font-grotesk font-bold text-[13px] border-r-2 last:border-r-0 border-brand-black transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-brand-black ${
                i === active ? "bg-brand-black text-white" : "bg-white text-brand-black hover:bg-brand-yellow/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Isi panel */}
        <div className="relative min-h-[390px] sm:min-h-[340px]" role="tabpanel">
          <AnimatePresence mode="wait">
            <motion.div
              key={TABS[active].id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="h-full"
            >
              <Panel />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <p className="mt-3 text-center text-caption font-medium text-brand-black/60">
        Contoh tampilan dengan data fiktif toko &quot;Kopi Senja&quot;
      </p>
    </div>
  );
}
