// ============================================================
// Syarat & Ketentuan, /syarat-ketentuan (halaman publik, tanpa login)
//
// DRAF yang disusun dari cara kerja aplikasi yang sebenarnya. Pemilik wajib
// meninjau (dan sebaiknya penasihat hukum). Bagian pembatalan/pengembalian
// dana sengaja dibuat netral sampai pemilik menentukan kebijakannya.
// ============================================================

import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { CONTACT } from "@/lib/contact";

export const metadata = {
  title: "Syarat & Ketentuan",
  description: "Aturan pemakaian layanan KasirAI: akun, paket dan pembayaran, fitur AI, serta batas tanggung jawab.",
  alternates: { canonical: "/syarat-ketentuan" },
};

export default function SyaratKetentuanPage() {
  return (
    <LegalPage
      title="Syarat & Ketentuan"
      updated="3 Oktober 2026"
      intro="Dengan membuat akun atau memakai KasirAI (sikasirai.com), kamu menyetujui syarat berikut. Mohon dibaca sampai selesai."
    >
      <LegalSection n={1} title="Tentang layanan">
        <p>
          KasirAI adalah aplikasi kasir (Point of Sale) berbasis web yang menyediakan kasir, manajemen stok, laporan,
          pembayaran digital lewat Midtrans, pengiriman struk ke WhatsApp, dan AI Assistant. Fitur yang tersedia
          bergantung pada paket langgananmu dan dapat berubah dari waktu ke waktu.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Akun dan keamanan">
        <ul>
          <li>Kamu wajib memberikan data yang benar saat mendaftar dan menjaga kerahasiaan kata sandi.</li>
          <li>Kamu bertanggung jawab atas semua aktivitas yang terjadi di akun tokomu, termasuk oleh kasir yang kamu beri akses.</li>
          <li>Segera hubungi kami bila akunmu dipakai tanpa izin.</li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Paket dan pembayaran">
        <ul>
          <li>Tersedia paket Free, Pro, dan Enterprise. Harga dan isi tiap paket tertera di bagian Harga pada halaman utama dan dapat berubah.</li>
          <li>Paket Free gratis dan hanya menerima pembayaran tunai. QRIS dan pembayaran digital tersedia di paket berbayar.</li>
          <li>Langganan berbayar dibayar per periode (bulanan atau tahunan) lewat Midtrans. Tidak ada penarikan otomatis dari kartu atau rekeningmu.</li>
          <li>Pembayaran transaksi tokomu dengan pelanggan diproses lewat akun Midtrans yang terhubung ke tokomu. Hubungan dan ketentuan dengan Midtrans mengikuti ketentuan Midtrans.</li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Pembatalan dan pengembalian dana">
        <p>
          Untuk permintaan pembatalan atau pengembalian dana, hubungi kami lewat kontak di bagian bawah halaman.
          Permintaan akan ditinjau satu per satu.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Fitur AI">
        <ul>
          <li>Jawaban AI Assistant dibuat otomatis dari data tokomu dan bisa saja keliru atau tidak lengkap.</li>
          <li>Jangan mengandalkan jawaban AI sebagai satu-satunya dasar keputusan keuangan, pajak, atau hukum. Cek angka penting di halaman Laporan.</li>
          <li>Pemakaian AI dibatasi sesuai kuota paketmu.</li>
        </ul>
      </LegalSection>

      <LegalSection n={6} title="Penggunaan yang dilarang">
        <ul>
          <li>Menggunakan layanan untuk kegiatan yang melanggar hukum atau merugikan pihak lain.</li>
          <li>Mencoba membobol, membebani, atau mengganggu sistem, termasuk mengakses data toko lain.</li>
          <li>Menyalin, menjual ulang, atau membongkar layanan tanpa izin tertulis.</li>
        </ul>
        <p>Kami dapat membatasi atau menonaktifkan akun yang melanggar ketentuan ini.</p>
      </LegalSection>

      <LegalSection n={7} title="Data milik kamu">
        <p>
          Data tokomu (produk, transaksi, pelanggan) tetap milikmu. Kami hanya memprosesnya untuk menjalankan layanan sesuai
          Kebijakan Privasi. Kamu bertanggung jawab atas kebenaran dan legalitas data yang kamu masukkan.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Ketersediaan layanan">
        <p>
          Kami berusaha menjaga layanan tetap berjalan, tetapi tidak menjamin layanan bebas gangguan. Layanan dapat sesekali
          terhenti atau melambat karena pemeliharaan, gangguan penyedia infrastruktur, atau hal di luar kendali kami.
          Sebaiknya simpan catatan penting di luar aplikasi.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Batas tanggung jawab">
        <p>
          Layanan disediakan apa adanya. Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung,
          kehilangan keuntungan, atau kehilangan data yang timbul dari pemakaian atau ketidakmampuan memakai layanan.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Perubahan syarat">
        <p>
          Syarat ini dapat diperbarui. Tanggal perubahan terakhir tercantum di bagian atas halaman. Dengan terus memakai
          KasirAI setelah perubahan, kamu dianggap menerima syarat yang baru.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Hukum yang berlaku dan kontak">
        <p>
          Syarat ini tunduk pada hukum Republik Indonesia. Pertanyaan tentang syarat ini bisa dikirim ke {CONTACT.email}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
