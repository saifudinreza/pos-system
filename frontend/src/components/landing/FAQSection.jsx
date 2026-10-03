// ============================================================
// FAQSection, Tanya jawab singkat di landing page (#faq)
//
// Semua jawaban disusun dari perilaku aplikasi yang sebenarnya
// (lihat backend/ & README). Kalau fitur atau harga berubah,
// perbarui jawaban di sini juga. Memakai <details> bawaan HTML,
// jadi bisa dibuka-tutup tanpa JavaScript dan ramah keyboard.
// ============================================================

import { Reveal } from "./motion";
import { CONTACT } from "@/lib/contact";

const FAQS = [
  {
    q: "Apakah KasirAI benar-benar gratis?",
    a: "Paket Free gratis tanpa batas waktu dan tanpa kartu kredit. Kamu bisa memakai kasir tunai, hingga 50 produk dan 15 kategori, transaksi tanpa batas, laporan harian dan bulanan, serta 5 pertanyaan AI per bulan. Fitur lanjutan ada di paket berbayar.",
  },
  {
    q: "Apa bedanya paket Free dan Pro?",
    a: "Pro (Rp 129.000 per bulan) membuka pembayaran QRIS dan e-wallet, produk dan kategori tanpa batas, unduh laporan PDF dan Excel, serta 10 pertanyaan AI per hari. Paket Free hanya menerima pembayaran tunai.",
  },
  {
    q: "Bagaimana cara menerima pembayaran QRIS atau e-wallet?",
    a: "Dengan paket Pro. Pembayaran digital diproses lewat Midtrans (QRIS, GoPay, OVO, Virtual Account, dan kartu kredit). Kamu bisa menghubungkan akun Midtrans milikmu sendiri di halaman Profil.",
  },
  {
    q: "Apakah struk bisa dikirim ke WhatsApp pelanggan?",
    a: "Bisa. Isi nomor HP pelanggan di kasir, dan struk digital terkirim otomatis ke WhatsApp begitu pembayaran lunas. Kalau nomornya tidak diisi, struk tetap bisa dicetak.",
  },
  {
    q: "Bagaimana AI Assistant menjawab pertanyaanku?",
    a: "AI membaca ringkasan penjualan (hari ini, minggu ini, bulan ini) dan stok tokomu, lalu menjawab dalam Bahasa Indonesia. Untuk itu, ringkasan data tokomu dikirim ke penyedia layanan AI. Jawaban AI bisa saja keliru, jadi cek angka penting di halaman Laporan.",
  },
  {
    q: "Apakah data tokoku terpisah dari toko lain?",
    a: "Ya. Setiap toko punya data sendiri dan tidak bisa melihat data toko lain. Kata sandi disimpan dalam bentuk ter-hash, dan kunci Midtrans disimpan terenkripsi. Detailnya ada di Kebijakan Privasi.",
  },
  {
    q: "Bisa dipakai di HP atau tablet?",
    a: "KasirAI adalah aplikasi web, jadi dibuka lewat browser. Kamu bisa memakainya di laptop, tablet, atau HP tanpa memasang aplikasi.",
  },
  {
    q: "Bagaimana sistem pembayaran langganan Pro?",
    a: "Langganan dibayar per periode (bulanan atau tahunan) lewat Midtrans. Tidak ada penarikan otomatis dari kartu atau rekeningmu. Untuk bantuan tagihan atau pembatalan, hubungi kami lewat WhatsApp.",
  },
];

/**
 * FAQSection, daftar pertanyaan yang sering muncul sebelum orang mendaftar.
 * Tanpa props & state. Kontak diambil dari src/lib/contact.js.
 */
export default function FAQSection() {
  return (
    <section id="faq" className="relative z-[1] py-20 px-4 sm:px-6 scroll-mt-28">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center mb-10">
          <div className="inline-block bg-brand-black text-brand-yellow px-3 py-1 text-xs font-grotesk font-black tracking-wider mb-4">
            FAQ
          </div>
          <h2 className="text-h2 text-brand-black font-grotesk">
            Pertanyaan yang sering ditanyakan
          </h2>
        </Reveal>

        <div className="flex flex-col gap-4">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group bg-white border-3 border-brand-black"
              style={{ boxShadow: "4px 4px 0 var(--ink)" }}
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4 font-black font-grotesk text-lg text-brand-black focus-visible:outline focus-visible:outline-4 focus-visible:outline-brand-yellow">
                {item.q}
                <span
                  aria-hidden="true"
                  className="shrink-0 w-8 h-8 border-2 border-brand-black bg-brand-yellow flex items-center justify-center font-black"
                >
                  <span className="block transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="px-5 pb-5 text-brand-black/70 font-medium leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="text-center mt-8 text-brand-black/60 font-medium">
          Belum menemukan jawabannya?{" "}
          <a
            href={`https://wa.me/${CONTACT.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-brand-black underline underline-offset-2"
          >
            Tanya lewat WhatsApp
          </a>
        </p>
      </div>
    </section>
  );
}
