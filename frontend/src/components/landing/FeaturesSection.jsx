// ============================================================
// FeaturesSection — Memperkenalkan fitur-fitur utama KasirAI
//
// Analogi: Ini seperti brosur produk — menampilkan setiap fitur
// dengan ikon, nama, dan penjelasan singkat. Calon pelanggan
// bisa scan cepat dan langsung paham apa yang mereka dapat.
//
// Relasi: Section ini berdiri sendiri, tidak bergantung pada state.
// Data fitur langsung ditulis di sini (tidak dari API).
// ============================================================

// Data fitur — disimpan di luar komponen agar mudah diupdate
// Analogi: seperti daftar menu yang bisa diubah tanpa mengubah "cara penyajiannya"
const FEATURES = [
  {
    // Ikon menggunakan emoji agar ringan (tidak perlu library ikon)
    icon:        "🖥️",
    title:       "Kasir Cepat & Akurat",
    description: "Interface kasir yang simpel. Proses transaksi dalam hitungan detik tanpa antrian panjang.",
    // Tag menandai fitur ini masuk kategori mana
    tag:         "POS",
    tagColor:    "bg-brand-yellow",
  },
  {
    icon:        "🤖",
    title:       "AI Assistant Cerdas",
    description: "Tanya apa saja ke AI: analisis penjualan, rekomendasi stok, tren produk — langsung dijawab.",
    tag:         "AI",
    tagColor:    "bg-brand-black text-white",
  },
  {
    icon:        "📊",
    title:       "Laporan Otomatis",
    description: "Laporan penjualan, laba-rugi, dan stok dibuat otomatis. Tidak perlu Excel lagi.",
    tag:         "Laporan",
    tagColor:    "bg-brand-yellow",
  },
  {
    icon:        "📦",
    title:       "Manajemen Stok Real-time",
    description: "Stok berkurang otomatis setiap transaksi. Dapat notifikasi saat stok hampir habis.",
    tag:         "Stok",
    tagColor:    "bg-brand-yellow",
  },
  {
    icon:        "🏪",
    title:       "Multi-Outlet",
    description: "Kelola banyak cabang dari satu dashboard. Lihat performa setiap outlet dalam satu layar.",
    tag:         "Outlet",
    tagColor:    "bg-brand-yellow",
  },
  {
    icon:        "💳",
    title:       "Berbagai Metode Bayar",
    description: "Terima tunai, QRIS, transfer bank, kartu debit/kredit. Semua terintegrasi otomatis.",
    tag:         "Pembayaran",
    tagColor:    "bg-brand-yellow",
  },
];

// --- FeatureCard: satu kartu fitur ---
// Analogi: seperti satu kartu dalam kumpulan kartu remi — punya tampilan yang sama
// tapi isi (ikon, judul, deskripsi) berbeda-beda
const FeatureCard = ({ icon, title, description, tag, tagColor }) => (
  <div
    className="bg-white border-3 border-brand-black p-6 flex flex-col gap-4 group transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1"
    style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
    // onMouseEnter: saat hover, shadow diperbesar (sudah di-handle via CSS class)
  >
    {/* Baris atas: ikon + tag kategori */}
    <div className="flex items-center justify-between">
      {/* Ikon besar — visual langsung */}
      <span className="text-4xl">{icon}</span>
      {/* Tag kategori — seperti label di produk */}
      <span
        className={`${tagColor} border-2 border-brand-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider`}
        style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
      >
        {tag}
      </span>
    </div>

    {/* Judul fitur */}
    <h3 className="font-black text-lg text-brand-black leading-tight font-grotesk">
      {title}
    </h3>

    {/* Deskripsi singkat */}
    <p className="text-sm text-brand-black/60 font-medium leading-relaxed flex-1">
      {description}
    </p>

    {/* Link "Pelajari Lebih" — muncul saat hover */}
    <p className="text-xs font-black text-brand-black underline underline-offset-2 opacity-0 group-hover:opacity-100 transition-opacity">
      Pelajari lebih lanjut →
    </p>
  </div>
);

export default function FeaturesSection() {
  return (
    // id="fitur" agar bisa di-link dari navbar (#fitur)
    <section id="fitur" className="py-20 px-4 sm:px-6 bg-brand-gray">
      <div className="max-w-6xl mx-auto">

        {/* === HEADER SECTION === */}
        <div className="mb-12">
          {/* Label section kecil — seperti tab kategori */}
          <div
            className="inline-block bg-brand-black text-white px-3 py-1 text-xs font-mono font-black tracking-wider mb-4"
            style={{ boxShadow: "2px 2px 0 #FFE500" }}
          >
            ✦ FITUR
          </div>
          {/* Judul section */}
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

        {/* === GRID FITUR ===
            Analogi: seperti rak pajangan di toko — 3 kolom, produk tersusun rapi */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* map: untuk setiap data di FEATURES, buat satu FeatureCard */}
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* === BANNER BAWAH: highlight AI === */}
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
          {/* Contoh pertanyaan ke AI */}
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
