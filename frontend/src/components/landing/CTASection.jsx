// ============================================================
// CTASection — Panggilan Aksi Terakhir (Call To Action)
//
// Analogi: Ini seperti kasir yang berkata "Mau dibungkus sekarang?"
// setelah pelanggan sudah keliling toko. Satu kesempatan terakhir
// sebelum mereka pergi — harus kuat dan meyakinkan.
//
// Desain: Section ini mencolok dengan background hitam +
// shadow kuning — kontras maksimal supaya tidak terlewat.
//
// Relasi: Diletakkan setelah Testimoni, sebelum Footer.
// Tidak ada state atau data — murni UI statis.
// ============================================================

import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-brand-gray">
      <div className="max-w-6xl mx-auto">

        {/* Kotak CTA utama — hitam pekat untuk kontras maksimal */}
        <div
          className="bg-brand-black text-white border-3 border-brand-black p-12 sm:p-16 text-center relative overflow-hidden"
          style={{ boxShadow: "8px 8px 0 #FFE500" }}
        >
          {/* Dekorasi latar — titik-titik kecil ala neobrutalist */}
          {/* Analogi: seperti motif di kemasan produk premium */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle, #FFE500 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Konten CTA — di atas layer dekorasi */}
          <div className="relative z-10">
            {/* Label */}
            <div
              className="inline-block bg-brand-yellow text-brand-black border-2 border-brand-yellow px-3 py-1 text-xs font-mono font-black tracking-wider mb-6"
            >
              ✦ MULAI SEKARANG
            </div>

            {/* Headline CTA — sesimpel dan sekuat mungkin */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-grotesk leading-tight mb-4">
              Tingkatkan bisnis Anda
              <br />
              <span className="text-brand-yellow">hari ini juga.</span>
            </h2>

            {/* Sub-teks — hilangkan keraguan terakhir */}
            <p className="text-white/60 font-medium text-lg max-w-lg mx-auto mb-10">
              Bergabung dengan 2.000+ pebisnis yang sudah merasakan manfaat KasirAI.
              Gratis 14 hari, tidak perlu kartu kredit.
            </p>

            {/* Tombol CTA — besar, kuning, mencolok */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-brand-yellow text-brand-black border-2 border-brand-yellow font-black text-lg neo-hover inline-block"
                style={{ boxShadow: "4px 4px 0 #FFE500" }}
              >
                Coba Gratis 14 Hari →
              </Link>
              <a
                href="#"
                className="px-8 py-4 bg-transparent text-white border-2 border-white/40 font-bold text-lg hover:border-white hover:bg-white/10 transition-colors inline-block"
              >
                Jadwalkan Demo
              </a>
            </div>

            {/* Trust badges terakhir — pengingat final */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm font-semibold text-white/40">
              <span>✓ Tanpa kartu kredit</span>
              <span>✓ Batalkan kapan saja</span>
              <span>✓ Support 7 hari seminggu</span>
              <span>✓ Setup dalam 5 menit</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
