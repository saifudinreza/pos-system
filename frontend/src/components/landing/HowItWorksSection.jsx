// ============================================================
// HowItWorksSection, "Cara Kerja": 3 langkah memulai KasirAI
//
// Layout: kolom kiri (sticky saat scroll) berisi judul + kotak
// bantuan support; kolom kanan deretan StepCard dengan garis
// penghubung antar langkah, diakhiri tombol CTA.
//
// Server component (tanpa "use client"), konten statis murni.
// ============================================================

import { UserPlus, LayoutList, Zap } from "lucide-react";

// 3 langkah setup, nomor, judul, deskripsi, ikon, dan poin detail
const STEPS = [
  {
    number:      "01",
    title:       "Daftar Akun",
    description: "Buat akun KasirAI dalam 2 menit. Isi nama toko, email, dan password. Langsung bisa dipakai, tanpa perlu install software.",
    Icon:        UserPlus,
    details:     ["Daftar via email", "Verifikasi akun", "Pilih paket"],
  },
  {
    number:      "02",
    title:       "Setup Produk",
    description: "Tambahkan produk dan kategori kamu. Bisa import dari Excel atau input manual. Stok dan harga langsung tersimpan.",
    Icon:        LayoutList,
    details:     ["Import atau input manual", "Atur kategori", "Set stok awal"],
  },
  {
    number:      "03",
    title:       "Mulai Jualan",
    description: "Buka kasir, pilih produk, terima pembayaran. Laporan otomatis dibuat setiap akhir hari. AI siap digunakan.",
    Icon:        Zap,
    details:     ["Kasir langsung aktif", "Laporan otomatis", "AI siap tanya-jawab"],
  },
];

/**
 * StepCard, satu langkah "Cara Kerja" (nomor besar + konten + detail).
 *
 * Props:
 *   step  : { number, title, description, Icon, details[] }
 *   isLast: true → garis penghubung ke langkah berikutnya disembunyikan
 */
const StepCard = ({ step, isLast }) => (
  <div className="relative flex flex-col sm:flex-row gap-6 items-start">
    <div className="flex-shrink-0">
      <div
        className="w-16 h-16 bg-brand-yellow border-3 border-brand-black flex items-center justify-center font-black text-2xl font-mono"
        style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
      >
        {step.number}
      </div>
      {!isLast && (
        <div className="hidden sm:block w-0.5 h-12 bg-brand-black/20 ml-8 mt-2" />
      )}
    </div>

    <div className="flex-1">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 bg-brand-black border-2 border-brand-black flex items-center justify-center shrink-0"
          style={{ boxShadow: "2px 2px 0 #FFE500" }}
        >
          <step.Icon size={16} className="text-brand-yellow" strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black text-brand-black font-grotesk">{step.title}</h3>
      </div>

      <p className="text-brand-black/60 font-medium leading-relaxed mb-4">
        {step.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {step.details.map((d) => (
          <span
            key={d}
            className="flex items-center gap-1.5 text-xs font-bold bg-white border-2 border-brand-black px-2 py-1"
            style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
          >
            <span className="text-green-600"></span> {d}
          </span>
        ))}
      </div>
    </div>
  </div>
);

export default function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Kolom kiri, sticky: judul tetap terlihat saat scroll deretan langkah */}
          <div className="lg:sticky lg:top-24">
            <div
              className="inline-block bg-brand-yellow border-2 border-brand-black px-3 py-1 text-xs font-mono font-black tracking-wider mb-6"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
               CARA KERJA
            </div>

            <h2 className="text-4xl sm:text-5xl font-black text-brand-black tracking-tight font-grotesk leading-tight mb-6">
              Mulai dalam
              <br />
              <span className="bg-brand-yellow px-1">3 langkah</span>
              <br />
              mudah.
            </h2>

            <p className="text-brand-black/60 font-medium leading-relaxed mb-8 max-w-sm">
              Tidak perlu pelatihan khusus. Tidak perlu tim IT. Siapapun
              bisa setup KasirAI sendiri dalam waktu kurang dari 10 menit.
            </p>

            <div
              className="bg-brand-black text-white p-5 border-2 border-brand-black"
              style={{ boxShadow: "4px 4px 0 #FFE500" }}
            >
              <p className="font-black text-lg mb-1">Butuh bantuan setup?</p>
              <p className="text-white/70 text-sm font-medium">
                Tim support kami siap membantu via WhatsApp & email, 7 hari seminggu.
              </p>
              <a
                href="https://wa.me/6281294508057?text=Halo%20KasirAI%2C%20saya%20butuh%20bantuan%20setup%20aplikasi."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-brand-yellow text-sm font-black underline underline-offset-2"
              >
                Hubungi support →
              </a>
            </div>
          </div>

          {/* Kolom kanan, deretan langkah + CTA */}
          <div className="flex flex-col gap-10">
            {STEPS.map((step, index) => (
              <StepCard
                key={step.number}
                step={step}
                isLast={index === STEPS.length - 1}
              />
            ))}

            <div className="pt-4">
              <a
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-yellow border-2 border-brand-black font-bold neo-hover"
                style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
              >
                Mulai Sekarang, Gratis →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
