// ============================================================
// LaporanScreen.jsx, isi layar HP pemilik di hero
//
// Tiruan halaman /reports versi mobile: 4 StatCard, grafik tren,
// dan produk terlaris. Digerakkan `step` dari demoFlow.js: toast
// "Struk terkirim ke WhatsApp" turun (langkah 4), lalu angka laporan
// bertambah sebesar transaksi tadi (langkah 5).
// Ukuran memakai em dengan font dasar 4.1cqw (ikut lebar layar).
// ============================================================

import LogoMark from "@/components/brand/LogoMark";
import { FINAL_STEP, angka, cartAt, reportAt, rupiah } from "./demoFlow";

const TOP = [
  { rank: "#1", name: "Kopi Susu Gula Aren", pct: "19.1%" },
  { rank: "#2", name: "Es Teh Manis",        pct: "16.4%" },
  { rank: "#3", name: "Nasi Goreng Spesial", pct: "12.1%" },
];

// Titik grafik 7 hari terakhir, dipetakan ke viewBox 220x100.
// Titik terakhir (hari ini) naik setelah transaksi masuk.
const POINTS = [[12, 66], [45, 60], [78, 73], [111, 51], [144, 37], [177, 22]];
const TODAY_X = 210;
const DATES = ["27/09", "28/09", "29/09", "30/09", "01/10", "02/10", "03/10"];

const card = "border-[0.15em] border-brand-black rounded-[0.3em]";
const cardShadow = { boxShadow: "0.22em 0.22em 0 var(--ink)" };

export default function LaporanScreen({ step = FINAL_STEP }) {
  const r = reportAt(step);
  const total = cartAt(FINAL_STEP).total;
  const todayY = r.delta ? 26 : 34;
  const last = POINTS[POINTS.length - 1];

  const stats = [
    { label: "TOTAL PENDAPATAN",    value: rupiah(r.revenue), sub: "7 hari terakhir", cls: "bg-brand-yellow text-brand-black" },
    { label: "TOTAL TRANSAKSI",     value: angka(r.orders),   sub: "order dibayar",   cls: "bg-brand-black text-white" },
    { label: "RATA-RATA TRANSAKSI", value: rupiah(r.average), sub: "per order",       cls: "bg-white text-brand-black" },
    { label: "PRODUK TERJUAL",      value: angka(r.items),    sub: "total item",      cls: "bg-success/15 text-brand-black" },
  ];

  return (
    <div aria-hidden="true" className="relative h-full bg-brand-gray text-brand-black font-grotesk text-[length:4.1cqw] leading-normal select-none">
      {/* Notifikasi struk WhatsApp */}
      <div
        className={`absolute z-[2] left-[0.6em] right-[0.6em] top-[2.2em] transition-[transform,opacity] duration-300 ease-out ${
          r.receiptSent ? "translate-y-0 opacity-100" : "-translate-y-[140%] opacity-0"
        }`}
      >
        <div className="bg-white border-[0.15em] border-brand-black px-[0.6em] py-[0.5em] flex items-center gap-[0.5em]" style={cardShadow}>
          <span className="w-[1.7em] h-[1.7em] shrink-0 rounded-[0.35em] bg-success border-[0.12em] border-brand-black flex items-center justify-center text-white text-[0.8em] font-black">✓</span>
          <span className="min-w-0 flex flex-col">
            <span className="text-[0.62em] font-bold leading-tight">Struk terkirim ke WhatsApp</span>
            <span className="text-[0.52em] font-mono text-brand-black/60 truncate">0812-3456-7890 · {rupiah(total)}</span>
          </span>
        </div>
      </div>

      {/* App bar (ruang atas untuk kamera punch-hole) */}
      <div className="bg-white border-b-[0.15em] border-brand-black px-[1.1em] pt-[2.6em] pb-[0.7em] flex items-center gap-[0.7em]">
        <svg className="w-[1.3em] h-[1.3em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <LogoMark size="1.6em" title="" />
        <span className="font-bold text-[0.95em]">KasirAI</span>
      </div>

      <div className="px-[1em] pt-[1em] pb-[1.2em] flex flex-col gap-[0.85em]">
        <div>
          <div className="font-bold text-[1.45em] leading-tight">Laporan</div>
          <div className="text-[0.68em] text-brand-black/50">Analisis penjualan &amp; kondisi stok</div>
        </div>

        <div className="grid grid-cols-2 gap-[0.6em]">
          {stats.map((s, i) => (
            <div key={s.label} className={`relative ${card} ${s.cls} px-[0.65em] py-[0.6em] flex flex-col gap-[0.35em]`} style={cardShadow}>
              <span className="font-mono font-bold text-[0.48em] tracking-[0.12em] opacity-60">{s.label}</span>
              <span key={s.value} className="hero-pop font-mono font-bold text-[0.82em] tracking-tight">{s.value}</span>
              <span className="text-[0.5em] font-semibold opacity-60">{s.sub}</span>
              {i === 0 && r.delta > 0 && (
                <span className="hero-pop absolute -top-[0.7em] right-[0.4em] bg-success text-white border-[0.12em] border-brand-black font-mono font-bold text-[0.5em] px-[0.5em] py-[0.1em]">
                  +{angka(r.delta)}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className={`${card} bg-white`} style={cardShadow}>
          <div className="px-[0.75em] py-[0.6em] border-b-[0.15em] border-brand-black">
            <div className="font-bold text-[0.72em]">Tren Penjualan</div>
            <div className="text-[0.55em] text-brand-black/40">Pendapatan per hari</div>
          </div>
          <svg viewBox="0 0 220 100" className="block w-full">
            <path d="M10 22H212M10 44H212M10 66H212" stroke="currentColor" strokeOpacity="0.06" />
            <path d="M8 82H214" stroke="currentColor" strokeWidth="2" />
            <polyline points={POINTS.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--yellow)" strokeWidth="3" strokeLinejoin="round" />
            {/* Ruas hari ini: naik saat transaksi masuk (langkah 5) */}
            <line x1={last[0]} y1={last[1]} x2={TODAY_X} y2={todayY} stroke="var(--yellow)" strokeWidth="3" strokeLinecap="round" />
            <g fill="var(--yellow)" stroke="currentColor" strokeWidth="2">
              {POINTS.map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.6" />)}
              <circle cx={TODAY_X} cy={todayY} r={r.delta ? 4.6 : 3.6} />
            </g>
            <g fontFamily="JetBrains Mono, monospace" fontSize="7.5" fill="currentColor" fillOpacity="0.6" textAnchor="middle">
              {[...POINTS.map(([x]) => x), TODAY_X].map((x, i) => <text key={x} x={x} y="94">{DATES[i]}</text>)}
            </g>
          </svg>
        </div>

        <div className={`${card} bg-white px-[0.75em] py-[0.6em] flex flex-col gap-[0.45em]`} style={cardShadow}>
          <div className="font-bold text-[0.72em]">Produk Terlaris</div>
          {TOP.map((t) => (
            <div key={t.rank} className="flex items-center gap-[0.5em] text-[0.6em]">
              <span className="font-mono font-bold text-brand-black/50">{t.rank}</span>
              <span className="flex-1 min-w-0 font-bold truncate">{t.name}</span>
              <span className="w-[3.5em] h-[0.6em] border-[0.1em] border-brand-black/20 bg-brand-gray overflow-hidden">
                <span className="block h-full bg-brand-yellow" style={{ width: t.pct }} />
              </span>
              <span className="font-mono font-bold">{t.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
