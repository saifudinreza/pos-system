// ============================================================
// LaporanScreen.jsx, isi layar HP Android di hero
//
// Tiruan statis halaman /reports versi mobile: tab Penjualan,
// filter periode, 4 StatCard, grafik tren, dan produk terlaris.
// Ukuran memakai em dengan font dasar 4.1cqw (ikut lebar layar).
// Angka demo dibuat konsisten: 8.640.000 / 312 = 27.692.
// ============================================================

import LogoMark from "@/components/brand/LogoMark";

const STATS = [
  { label: "TOTAL PENDAPATAN",    value: "Rp 8.640.000", sub: "7 hari terakhir", cls: "bg-brand-yellow text-brand-black" },
  { label: "TOTAL TRANSAKSI",     value: "312",          sub: "order dibayar",   cls: "bg-brand-black text-white" },
  { label: "RATA-RATA TRANSAKSI", value: "Rp 27.692",    sub: "per order",       cls: "bg-white text-brand-black" },
  { label: "PRODUK TERJUAL",      value: "587",          sub: "total item",      cls: "bg-green-100 text-brand-black" },
];

const TOP = [
  { rank: "#1", name: "Kopi Susu Gula Aren", pct: "19.1%" },
  { rank: "#2", name: "Es Teh Manis",        pct: "16.4%" },
  { rank: "#3", name: "Nasi Goreng Spesial", pct: "12.1%" },
];

// Titik grafik: 7 hari terakhir (juta rupiah), sudah dipetakan ke viewBox 220x100
const POINTS = [[12, 66], [45, 60], [78, 73], [111, 51], [144, 37], [177, 22], [210, 34]];
const DATES  = ["27/09", "28/09", "29/09", "30/09", "01/10", "02/10", "03/10"];

const card = "border-[0.15em] border-brand-black rounded-[0.3em]";
const cardShadow = { boxShadow: "0.22em 0.22em 0 #0A0A0A" };
const chipShadow = { boxShadow: "0.15em 0.15em 0 #0A0A0A" };

export default function LaporanScreen() {
  return (
    <div aria-hidden="true" className="h-full bg-brand-gray text-brand-black font-grotesk text-[length:4.1cqw] leading-normal select-none">
      {/* App bar (ruang atas untuk kamera punch-hole) */}
      <div className="bg-white border-b-[0.15em] border-brand-black px-[1.1em] pt-[2.6em] pb-[0.7em] flex items-center gap-[0.7em]">
        <svg className="w-[1.3em] h-[1.3em]" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round">
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

        <div className="flex border-b-[0.15em] border-brand-black text-[0.75em] font-bold">
          <span className="bg-brand-yellow border-b-[0.2em] border-brand-black -mb-[0.2em] px-[1.1em] py-[0.5em]">Penjualan</span>
          <span className="px-[1.1em] py-[0.5em]">Stok</span>
        </div>

        <div className="flex gap-[0.45em] text-[0.65em] font-bold">
          <span className="bg-white border-[0.15em] border-brand-black px-[0.7em] py-[0.35em]" style={chipShadow}>Hari Ini</span>
          <span className="bg-brand-yellow border-[0.15em] border-brand-black px-[0.7em] py-[0.35em]" style={chipShadow}>7 Hari</span>
          <span className="bg-white border-[0.15em] border-brand-black px-[0.7em] py-[0.35em]" style={chipShadow}>30 Hari</span>
        </div>

        <div className="grid grid-cols-2 gap-[0.6em]">
          {STATS.map((s) => (
            <div key={s.label} className={`${card} ${s.cls} px-[0.65em] py-[0.6em] flex flex-col gap-[0.35em]`} style={cardShadow}>
              <span className="font-mono font-bold text-[0.48em] tracking-[0.12em] opacity-60">{s.label}</span>
              <span className="font-mono font-bold text-[0.82em] tracking-tight">{s.value}</span>
              <span className="text-[0.5em] font-semibold opacity-60">{s.sub}</span>
            </div>
          ))}
        </div>

        <div className={`${card} bg-white`} style={cardShadow}>
          <div className="px-[0.75em] py-[0.6em] border-b-[0.15em] border-brand-black">
            <div className="font-bold text-[0.72em]">Tren Penjualan</div>
            <div className="text-[0.55em] text-brand-black/40">Pendapatan per periode</div>
          </div>
          <svg viewBox="0 0 220 100" className="block w-full">
            <path d="M10 22H212M10 44H212M10 66H212" stroke="#0A0A0A" strokeOpacity="0.06" />
            <path d="M8 82H214" stroke="#0A0A0A" strokeWidth="2" />
            <polyline points={POINTS.map((p) => p.join(",")).join(" ")} fill="none" stroke="#FFE500" strokeWidth="3" strokeLinejoin="round" />
            <g fill="#FFE500" stroke="#0A0A0A" strokeWidth="2">
              {POINTS.map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.6" />)}
            </g>
            <g fontFamily="JetBrains Mono, monospace" fontSize="7.5" fill="#0A0A0A" fillOpacity="0.6" textAnchor="middle">
              {POINTS.map(([x], i) => <text key={x} x={x} y="94">{DATES[i]}</text>)}
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
