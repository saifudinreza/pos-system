import {
  MonitorCheck,
  BrainCircuit,
  BarChart3,
  Package,
  Building2,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    Icon:        MonitorCheck,
    title:       "Kasir Cepat & Akurat",
    description: "Interface kasir yang simpel. Proses transaksi dalam hitungan detik tanpa antrian panjang.",
    tag:         "POS",
    tagColor:    "bg-brand-yellow",
    iconBg:      "bg-brand-yellow",
  },
  {
    Icon:        BrainCircuit,
    title:       "AI Assistant Cerdas",
    description: "Tanya apa saja ke AI: analisis penjualan, rekomendasi stok, tren produk — langsung dijawab.",
    tag:         "AI",
    tagColor:    "bg-brand-black text-white",
    iconBg:      "bg-brand-black",
    iconColor:   "text-brand-yellow",
  },
  {
    Icon:        BarChart3,
    title:       "Laporan Otomatis",
    description: "Laporan penjualan, laba-rugi, dan stok dibuat otomatis. Tidak perlu Excel lagi.",
    tag:         "Laporan",
    tagColor:    "bg-brand-yellow",
    iconBg:      "bg-brand-yellow",
  },
  {
    Icon:        Package,
    title:       "Manajemen Stok Real-time",
    description: "Stok berkurang otomatis setiap transaksi. Dapat notifikasi saat stok hampir habis.",
    tag:         "Stok",
    tagColor:    "bg-brand-yellow",
    iconBg:      "bg-brand-yellow",
  },
  {
    Icon:        Building2,
    title:       "Multi-Outlet",
    description: "Kelola banyak cabang dari satu dashboard. Lihat performa setiap outlet dalam satu layar.",
    tag:         "Outlet",
    tagColor:    "bg-brand-yellow",
    iconBg:      "bg-brand-yellow",
  },
  {
    Icon:        Wallet,
    title:       "Berbagai Metode Bayar",
    description: "Terima tunai, QRIS, transfer bank, kartu debit/kredit. Semua terintegrasi otomatis.",
    tag:         "Pembayaran",
    tagColor:    "bg-brand-yellow",
    iconBg:      "bg-brand-yellow",
  },
];

const FeatureCard = ({ Icon, title, description, tag, tagColor, iconBg, iconColor = "text-brand-black" }) => (
  <div
    className="bg-white border-3 border-brand-black p-6 flex flex-col gap-4 group transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1"
    style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
  >
    <div className="flex items-center justify-between">
      <div
        className={`w-12 h-12 ${iconBg} border-2 border-brand-black flex items-center justify-center`}
        style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
      >
        <Icon size={22} className={iconColor} strokeWidth={2.5} />
      </div>
      <span
        className={`${tagColor} border-2 border-brand-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider`}
        style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
      >
        {tag}
      </span>
    </div>

    <h3 className="font-black text-lg text-brand-black leading-tight font-grotesk">
      {title}
    </h3>

    <p className="text-sm text-brand-black/60 font-medium leading-relaxed flex-1">
      {description}
    </p>

    
  </div>
);

export default function FeaturesSection() {
  return (
    <section id="fitur" className="py-20 px-4 sm:px-6 bg-brand-gray">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div
            className="inline-block bg-brand-black text-white px-3 py-1 text-xs font-mono font-black tracking-wider mb-4"
            style={{ boxShadow: "2px 2px 0 #FFE500" }}
          >
            ✦ FITUR
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-brand-black tracking-tight font-grotesk max-w-xl">
            Semua yang kamu
            <br />
            butuhkan,{" "}
            <span className="bg-brand-yellow px-1">satu platform.</span>
          </h2>
          <p className="mt-4 text-brand-black/60 font-medium max-w-lg">
            Dari kasir hingga laporan, dari manajemen stok hingga AI — semuanya
            terhubung dan bekerja otomatis buat bisnis Anda.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        <div
          className="mt-8 bg-brand-black text-white border-3 border-brand-black p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ boxShadow: "6px 6px 0 #FFE500" }}
        >
          <div>
            <div className="text-brand-yellow font-mono font-black text-sm tracking-wider mb-2">
              ✦ FITUR UNGGULAN
            </div>
            <h3 className="text-2xl font-black leading-tight">
              AI Assistant yang benar-benar paham bisnis Anda
            </h3>
            <p className="text-white/60 mt-2 text-sm font-medium max-w-md">
              Bukan sekadar chatbot biasa. AI KasirAI membaca data penjualan Anda dan
              memberi insight yang actionable — kapan saja Anda tanya.
            </p>
          </div>
          <div className="shrink-0 space-y-2">
            {[
              '"Produk apa yang paling laris minggu ini?"',
              '"Stok mana yang perlu saya reorder?"',
              '"Berapa rata-rata omzet per hari bulan ini?"',
            ].map((q) => (
              <div
                key={q}
                className="bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-mono text-white/80"
              >
                {q}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
