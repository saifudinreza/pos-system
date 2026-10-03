// ============================================================
// Kebijakan Privasi, /kebijakan-privasi (halaman publik, tanpa login)
//
// DRAF yang disusun dari alur data aplikasi yang sebenarnya (backend/ &
// CLAUDE.md). Pemilik wajib meninjau isinya (dan sebaiknya penasihat
// hukum) sebelum dianggap final. Perbarui juga kalau ada layanan pihak
// ketiga baru atau data baru yang dikumpulkan.
// ============================================================

import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { CONTACT } from "@/lib/contact";

export const metadata = {
  title: "Kebijakan Privasi",
  description: "Data apa yang dikumpulkan KasirAI, untuk apa dipakai, dan siapa saja yang memprosesnya.",
  alternates: { canonical: "/kebijakan-privasi" },
};

export default function KebijakanPrivasiPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      updated="3 Oktober 2026"
      intro="Halaman ini menjelaskan data apa yang dikumpulkan KasirAI (sikasirai.com), untuk apa data itu dipakai, dan siapa saja yang ikut memprosesnya. Kami berusaha menulisnya dengan bahasa yang mudah dipahami."
    >
      <LegalSection n={1} title="Siapa kami">
        <p>
          KasirAI adalah aplikasi kasir (Point of Sale) berbasis web untuk UMKM Indonesia, dikelola oleh Saifudin Reza.
          Pertanyaan tentang privasi bisa dikirim lewat email {CONTACT.email} atau WhatsApp (lihat bagian bawah halaman).
        </p>
      </LegalSection>

      <LegalSection n={2} title="Data yang kami kumpulkan">
        <p>Data yang kamu berikan saat mendaftar dan memakai aplikasi:</p>
        <ul>
          <li>Data akun: nama, email, nomor HP (opsional), nama toko, dan kata sandi (disimpan dalam bentuk ter-hash, bukan teks asli).</li>
          <li>Data toko: produk, kategori, stok, harga jual dan harga modal, pesanan, transaksi, shift kasir, dan laporan.</li>
          <li>Data pelanggan toko yang diisi kasir: nama dan nomor HP pelanggan (untuk mengirim struk dan daftar pelanggan).</li>
          <li>Data langganan: paket, periode, dan status pembayaran. Data kartu atau rekening tidak disimpan di server kami; pembayaran diproses oleh Midtrans.</li>
          <li>Pertanyaan yang kamu ketik ke AI Assistant dan jumlah pemakaian AI.</li>
        </ul>
        <p>Data teknis yang terkumpul otomatis: alamat IP, jenis browser, dan statistik kunjungan halaman.</p>
      </LegalSection>

      <LegalSection n={3} title="Untuk apa data dipakai">
        <ul>
          <li>Menjalankan fitur kasir, stok, laporan, dan langganan.</li>
          <li>Mengirim struk digital ke WhatsApp pelanggan dan kode OTP lupa password ke emailmu.</li>
          <li>Menjawab pertanyaan lewat AI Assistant berdasarkan data tokomu.</li>
          <li>Menjaga keamanan, mencegah penyalahgunaan, dan memperbaiki layanan.</li>
          <li>Memahami cara pengunjung memakai situs (statistik anonim).</li>
        </ul>
        <p>Kami tidak menjual datamu kepada siapa pun.</p>
      </LegalSection>

      <LegalSection n={4} title="Pihak ketiga yang memproses data">
        <p>Untuk menjalankan layanan, data tertentu diproses oleh penyedia berikut:</p>
        <ul>
          <li><b>Midtrans</b>: memproses pembayaran QRIS, e-wallet, transfer bank, kartu kredit, dan pembayaran langganan.</li>
          <li><b>Fonnte</b>: mengirim struk ke WhatsApp. Nomor HP pelanggan dan isi struk dikirim lewat layanan ini.</li>
          <li><b>Resend</b>: mengirim email berisi kode OTP lupa password.</li>
          <li><b>Penyedia layanan AI (Groq dan OpenRouter)</b>: saat kamu bertanya ke AI Assistant, ringkasan penjualan dan stok tokomu dikirim ke penyedia ini untuk membuat jawaban.</li>
          <li><b>Cloudflare R2</b>: menyimpan foto produk.</li>
          <li><b>Render, TiDB Cloud, dan Vercel</b>: menjalankan server, database, dan situs web.</li>
          <li><b>Google Analytics dan Vercel Speed Insights</b>: statistik kunjungan dan kecepatan situs.</li>
        </ul>
        <p>Masing-masing penyedia punya kebijakan privasinya sendiri.</p>
      </LegalSection>

      <LegalSection n={5} title="Keamanan data">
        <ul>
          <li>Data setiap toko dipisahkan dari toko lain, jadi satu toko tidak bisa melihat data toko lain.</li>
          <li>Kata sandi disimpan ter-hash; kunci server Midtrans milik toko disimpan terenkripsi.</li>
          <li>Token WhatsApp dan kunci rahasia layanan tidak pernah dikirim ke browser.</li>
          <li>Koneksi ke situs memakai HTTPS.</li>
        </ul>
        <p>Tidak ada sistem yang sepenuhnya kebal. Gunakan kata sandi yang kuat dan jangan membagikannya.</p>
      </LegalSection>

      <LegalSection n={6} title="Cookie dan penyimpanan di browser">
        <p>
          Kami memakai cookie dan penyimpanan lokal browser untuk menyimpan sesi login. Google Analytics juga dapat memasang
          cookie statistik. Kamu bisa menghapus atau memblokir cookie lewat pengaturan browser, tetapi login mungkin tidak berfungsi.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Hak kamu atas data">
        <p>
          Kamu dapat meminta akses, perbaikan, atau penghapusan akun dan data tokomu dengan menghubungi kami lewat kontak di atas.
          Kami akan menanggapi secepat yang kami bisa. Beberapa data transaksi bisa tetap kami simpan bila diperlukan untuk
          kewajiban hukum atau pembukuan.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Data pelanggan milik tokomu">
        <p>
          Kalau kamu memasukkan data pelanggan (nama, nomor HP), kamulah yang bertanggung jawab memastikan pelanggan
          mengetahui dan menyetujui penggunaannya, misalnya untuk pengiriman struk.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Perubahan kebijakan">
        <p>
          Kebijakan ini bisa diperbarui. Tanggal perubahan terakhir tercantum di bagian atas halaman. Dengan terus memakai
          KasirAI setelah perubahan, kamu dianggap menerima kebijakan yang baru.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
