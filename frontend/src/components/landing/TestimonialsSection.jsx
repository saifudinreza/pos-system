// ============================================================
// TestimonialsSection — Ulasan dari pengguna nyata KasirAI
//
// Analogi: Seperti kolom "Review Pembeli" di marketplace —
// orang lebih percaya rekomendasi sesama pembeli daripada iklan.
// Ini namanya "social proof" — bukti sosial yang membangun kepercayaan.
//
// Relasi: Berdiri sendiri. Data testimoni ditulis statis di sini.
// Di masa depan, bisa diganti dengan data dari API.
// ============================================================

// Data testimoni — orang nyata dengan cerita nyata
// (Analogi: seperti buku tamu di toko atau restoran)
const TESTIMONIALS = [
  {
    name:     "Budi Santoso",
    role:     "Pemilik Warung Makan Pak Budi",
    location: "Bandung",
    avatar:   "BS",    // Inisial nama untuk avatar (tanpa perlu gambar)
    rating:   5,
    quote:
      "Sebelum pakai KasirAI, saya hitung kasir manual pakai kertas. Sekarang laporan langsung ada di HP. AI-nya juga bantu saya tahu produk mana yang paling laris. Mantap!",
    // Highlight angka — dampak nyata yang bisa diukur
    highlight: "Hemat 2 jam/hari",
  },
  {
    name:     "Siti Rahayu",
    role:     "Manager Operasional, Kedai Kopi Rajawali",
    location: "Jakarta",
    avatar:   "SR",
    rating:   5,
    quote:
      "Kami punya 3 cabang dan dulu susah banget monitor semuanya. KasirAI bikin saya bisa lihat performa tiap cabang dari satu dashboard. AI assistant-nya beneran berguna untuk analisis penjualan.",
    highlight: "3 cabang, 1 dashboard",
  },
  {
    name:     "Andi Wijaya",
    role:     "Apoteker & Pemilik Apotek Sehat",
    location: "Surabaya",
    avatar:   "AW",
    rating:   5,
    quote:
      "Setup mudah, tampilan simpel, laporan lengkap. Stok obat jadi tidak pernah kosong karena ada notifikasi otomatis. Harganya juga worth it banget untuk fitur sebanyak ini.",
    highlight: "Stok tidak pernah kosong",
  },
  {
    name:     "Rina Kusuma",
    role:     "Owner Toko Baju Online & Offline",
    location: "Yogyakarta",
    avatar:   "RK",
    rating:   5,
    quote:
      "Awalnya ragu mau pindah dari sistem lama. Ternyata migrasinya gampang banget, tim support nya ramah. Dalam seminggu sudah terbiasa. Fitur QRIS-nya yang paling sering dipakai pelanggan.",
    highlight: "Migrasi < 1 minggu",
  },
];

/**
 * StarRating — deretan 5 bintang (★). Bintang terisi = warna kuning.
 * Props: count — jumlah bintang terisi (0–5).
 */
// --- StarRating: bintang rating ---
// Analogi: seperti bintang di Google Maps
const StarRating = ({ count }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      // Bintang ke-i terisi kalau i < count (indeks 0-based)
      <span key={i} className={i < count ? "text-brand-yellow" : "text-brand-black/20"}>
        ★
      </span>
    ))}
  </div>
);

/**
 * Avatar — lingkaran dengan inisial nama pengguna (tanpa gambar).
 * Props: initials — 1–2 huruf (mis. "BS", "SR").
 */
// --- Avatar: lingkaran dengan inisial nama ---
// Analogi: seperti foto profil yang digantikan huruf depan nama
const Avatar = ({ initials }) => (
  <div
    className="w-10 h-10 bg-brand-yellow border-2 border-brand-black flex items-center justify-center font-black text-sm shrink-0"
    style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
  >
    {initials}
  </div>
);

/**
 * TestimonialCard — satu kartu testimoni (rating + kutipan + profil).
 * Props: t — objek dari TESTIMONIALS (name, role, location, avatar,
 * rating, quote, highlight).
 */
// --- TestimonialCard: satu kartu testimoni ---
const TestimonialCard = ({ t }) => (
  <div
    className="bg-white border-3 border-brand-black p-6 flex flex-col gap-4 h-full hover:-translate-x-1 hover:-translate-y-1 transition-transform"
    style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
  >
    {/* Baris atas: rating bintang */}
    <StarRating count={t.rating} />

    {/* Kutipan testimoni — diapit tanda petik besar */}
    <blockquote className="text-brand-black/70 font-medium leading-relaxed text-sm flex-1 italic">
      "{t.quote}"
    </blockquote>

    {/* Highlight dampak — angka/fakta yang diringkas */}
    <div
      className="bg-brand-yellow border-2 border-brand-black px-3 py-1 text-xs font-black font-mono inline-block self-start"
      style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
    >
      ✦ {t.highlight}
    </div>

    {/* Profil pengguna: avatar + nama + role */}
    <div className="flex items-center gap-3 pt-2 border-t-2 border-brand-black/10">
      <Avatar initials={t.avatar} />
      <div>
        <p className="font-black text-sm text-brand-black">{t.name}</p>
        <p className="text-xs text-brand-black/50 font-medium">
          {t.role} · {t.location}
        </p>
      </div>
    </div>
  </div>
);

/**
 * TestimonialsSection — grid testimoni + rating agregat + logo industri
 * (lihat header file). Tanpa props; data statis di TESTIMONIALS.
 */
export default function TestimonialsSection() {
  return (
    <section id="testimoni" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* === HEADER === */}
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div
              className="inline-block bg-brand-black text-white px-3 py-1 text-xs font-mono font-black tracking-wider mb-4"
              style={{ boxShadow: "2px 2px 0 #FFE500" }}
            >
              ✦ TESTIMONI
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-brand-black tracking-tight font-grotesk">
              Dipercaya{" "}
              <span className="bg-brand-yellow px-1">2.000+</span>
              <br />
              bisnis di Indonesia
            </h2>
          </div>

          {/* Rating ringkasan — seperti score agregat di review platform */}
          <div
            className="bg-brand-yellow border-3 border-brand-black p-4 text-center shrink-0"
            style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
          >
            <p className="text-5xl font-black text-brand-black font-mono">4.9</p>
            <div className="flex justify-center my-1">
              <StarRating count={5} />
            </div>
            <p className="text-xs font-bold text-brand-black/60">dari 1.200+ ulasan</p>
          </div>
        </div>

        {/* === GRID TESTIMONI ===
            2 kolom di tablet, 2 kolom di desktop dengan baris atas lebih besar */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </div>

        {/* === LOGO MEDIA / PARTNER (placeholder) ===
            Analogi: seperti logo media yang meliput toko Anda di koran */}
        <div className="mt-16 pt-8 border-t-2 border-brand-black/10">
          <p className="text-center text-xs font-bold text-brand-black/40 uppercase tracking-widest mb-6">
            Digunakan oleh bisnis dari berbagai industri
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              "Rumah Makan",
              "Cafe & Kopi",
              "Minimarket",
              "Apotek",
              "Toko Fashion",
              "Toko Online",
            ].map((industry) => (
              <div
                key={industry}
                className="border-2 border-brand-black/20 px-4 py-2 text-xs font-bold text-brand-black/40 font-mono"
              >
                {industry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
