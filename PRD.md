# PRD — KasirAI

Product Requirements Document. Disusun berdasarkan `README.md` dan `CLAUDE.md` di repo ini sebagai sumber kebenaran (arsitektur, fitur, dan batasan yang tercatat di sana tidak diulang-jelaskan dari nol, hanya dirangkum jadi format requirement).

## 1. Ringkasan Produk

**KasirAI** adalah SaaS Point of Sale (POS) berbasis web untuk UMKM Indonesia. Setiap toko yang mendaftar menjadi satu *tenant* terisolasi dengan datanya sendiri, dan bisa langsung memakai kasir, mengelola stok, menerima pembayaran digital via Midtrans, mengirim struk otomatis ke WhatsApp pelanggan, serta bertanya soal kondisi bisnisnya ke AI Assistant berbahasa Indonesia.

- Live: https://sikasirai.com/
- Status: production (bukan sandbox) — Midtrans sudah mode production, transaksi memindahkan uang asli.
- Dibangun solo oleh **Saifudin Reza** sebagai final project Full Stack Web Development Bootcamp 2026.

## 2. Latar Belakang & Masalah

UMKM Indonesia umumnya masih mencatat penjualan manual atau pakai aplikasi kasir yang tidak punya konteks bisnis (tidak bisa menjawab "produk apa yang perlu direstock", "berapa omzet minggu ini dibanding bulan lalu", dll). Kasir juga sering bergantian orang dalam satu shift tanpa sistem serah-terima kas yang rapi, dan pembayaran digital butuh integrasi payment gateway yang aman per-toko.

## 3. Tujuan Produk

1. Menyediakan POS yang bisa langsung dipakai toko fisik: jual produk, terima berbagai metode bayar, cetak/kirim struk.
2. Memberi visibilitas bisnis instan lewat AI Assistant yang menjawab pertanyaan penjualan/stok dalam Bahasa Indonesia, tanpa perlu buka laporan manual.
3. Mendukung banyak toko (tenant) sekaligus dalam satu instance, dengan isolasi data yang tidak bisa bocor antar tenant.
4. Menjalankan model bisnis SaaS nyata: paket berlangganan berbayar (Free/Pro/Enterprise) dengan billing otomatis.

## 4. Target Pengguna

| Peran | Siapa | Kebutuhan utama |
|---|---|---|
| Pemilik UMKM (admin/developer akun toko) | Pemilik warung/toko kecil-menengah | Kelola produk, lihat laporan, atur langganan & Midtrans |
| Kasir | Pegawai toko yang jaga kasir | Transaksi cepat, buka/tutup shift, cetak/kirim struk |
| Developer (internal KasirAI) | Operator platform | Monitor semua tenant, kelola langganan, support |

Role hierarki: `user` < `kasir` < `admin` < `developer` (lihat tabel hak akses di §8).

## 5. Ruang Lingkup Fitur

### 5.1 Landing Page & Onboarding
- Halaman marketing publik (Hero, Problem, Features, How It Works, AI Spotlight, Testimonials, Pricing, CTA) dengan animasi Framer Motion.
- Alur daftar → pilih paket → dashboard.

### 5.2 Subscription & Billing
- 3 paket dengan harga terpusat di backend (`SubscriptionController::PRICES`):
  - **Free (Rp 0)**: 1 outlet, maks. 50 produk & 15 kategori, transaksi tanpa batas, 5 prompt AI/bulan, pembayaran tunai saja.
  - **Pro**: Rp 129.000/bulan (Rp 100.000/bulan jika tahunan) — produk/kategori unlimited, AI Assistant 10 prompt/hari, export PDF/Excel, QRIS & e-wallet.
  - **Enterprise**: Rp 499.000/bulan (Rp 399.000/bulan jika tahunan) — semua fitur Pro + AI Assistant 50 prompt/hari, outlet unlimited, API & integrasi kustom, account manager, SLA.
- Enforcement berlapis: backend memblokir fitur premium untuk paket Free (QRIS → 422, export → 403, AI habis → 429), frontend juga memblokir/menyembunyikan tombol.
- Upgrade paket dibayar via Midtrans Snap (bulanan/tahunan, harga tahunan diskon).
- Webhook otomatis mengaktifkan paket + upgrade role user saat status `settlement`.
- User bisa membatalkan transaksi pending miliknya sendiri.
- Developer bisa memonitor semua tenant, mengubah plan, atau suspend akun.

### 5.3 POS Terminal (`/kasir`)
- Split-screen: grid produk (search real-time debounce 400ms, filter kategori) + keranjang belanja.
- Validasi stok real-time saat menambah item ke keranjang.
- Bayar Tunai — kalkulasi kembalian otomatis.
- Bayar Digital — Midtrans Snap (QRIS, GoPay, OVO, VA, kartu kredit).
- Struk digital: cetak atau kirim ke WhatsApp pelanggan.
- Panel kelola produk langsung dari kasir (slide-over), tanpa pindah halaman.
- **Kasir terkunci sampai shift dibuka**: begitu halaman kasir dibuka tanpa shift aktif, form "Buka Shift" langsung tampil di depan dan grid produk + keranjang di-blur & tidak bisa diklik sampai shift dibuka.

### 5.4 Shift Management / Klerek
- Shift **per-tenant** (bukan per-user) — satu shift aktif dipakai bersama semua kasir dalam tenant yang sama.
- Auto-resume saat login dalam jam shift yang masih aktif (tidak perlu isi ulang form buka shift), termasuk setelah logout/login ulang oleh kasir lain, selama shift belum ditutup.
- Form buka shift: nama custom + preset (Pagi/Siang/Malam) + jam mulai/selesai custom + kalkulator denominasi uang fisik + modal awal + catatan.
- Realtime enforcement: transaksi otomatis diblokir di luar jam shift, dengan banner peringatan.
- Tutup shift (6 bagian): identitas, ringkasan penjualan, breakdown metode pembayaran, hitung kas fisik (kalkulator pecahan), kas kecil, rekonsiliasi otomatis dengan indikator selisih berwarna (pas/lebih/kurang).
- Riwayat shift lengkap per-shift, bisa dilihat ulang laporannya.

### 5.5 Dashboard & Analytics
- Stat card real-time: revenue, order, stok kritis, total produk.
- Line chart tren 7 hari, bar chart top produk, pie chart metode pembayaran.
- 10 transaksi terbaru.

### 5.6 AI Assistant (Sidebar)
- Chat Bahasa Indonesia, menjawab pertanyaan apa pun tentang bisnis tenant tersebut.
- Backend mengirim data 3 periode sekaligus (hari ini/minggu ini/bulan ini, dihitung via `whereBetween`) plus katalog & stok produk penuh di setiap request, supaya AI tidak salah label periode dan bisa jawab soal stok tanpa endpoint terpisah.
- 3 mode: analisis penjualan, prediksi stok habis, rekomendasi bundling.
- Dual-provider: Groq (primer, LLaMA 3.3 70B) → OpenRouter (fallback otomatis via circuit breaker, cooldown 65 detik saat Groq rate-limited). Badge menunjukkan provider aktif.
- Kuota AI per paket: Free = 5 prompt/bulan (per bulan kalender), Pro = 10 prompt/hari, Enterprise = 50 prompt/hari (per hari kalender); tersedia untuk admin & kasir (kasir mengikuti plan admin tenant via `effective_plan`). Tambahan: throttle `10,1` (10 request/menit/user) di 3 endpoint AI untuk mencegah burst/script abuse yang memenuhi rate limit Groq (shared key).

### 5.7 Laporan (`/reports`)
- Filter: hari ini, 7 hari, 30 hari, custom range.
- Download PDF & Excel (generate di backend).
- Tab penjualan + tab stok.

### 5.8 Manajemen Produk, Kategori, Pesanan, Transaksi
- CRUD lengkap + upload foto (via proxy R2, lihat §7).
- Badge status stok: Normal / Menipis / Habis.
- Update status order, void, batalkan transaksi.

### 5.9 User & Tenant Management, AI Monitoring
- CRUD user dengan role-based guard (khusus Developer).
- Panel developer: monitor semua tenant & status langganan, ubah plan, suspend/aktifkan akun.
- Dashboard monitoring pemakaian AI: token, provider, kuota per-user.

## 6. Hak Akses per Role

| Fitur | user | kasir | admin | developer |
|---|:---:|:---:|:---:|:---:|
| POS + Shift Management | ✅ | ✅ | ✅ | ✅ |
| Kelola Produk & Kategori | — | ✅ | ✅ | ✅ |
| Pesanan & Transaksi | — | ✅ | ✅ | ✅ |
| Dashboard & Laporan | — | — | ✅ | ✅ |
| Konfigurasi Midtrans | — | — | ✅ | ✅ |
| AI Assistant | — | ✅ | ✅ | ✅ |
| AI Monitoring | — | — | ✅ | ✅ |
| User Management | — | — | — | ✅ |
| Kelola Tenant & Subscription (semua toko) | — | — | — | ✅ |

## 7. Requirement Arsitektur & Non-Fungsional

Ini adalah keputusan arsitektur yang **wajib dipatuhi** saat mengembangkan fitur baru (sumber: `CLAUDE.md` §Arsitektur Kunci):

1. **Isolasi multi-tenant otomatis** — semua query tenant-aware wajib lewat Laravel Global Scope (`TenantScope`), tidak boleh filter tenant manual di controller. `tenant_id = null` khusus role `developer`.
2. **AI harus dual-provider** — tidak boleh hardcode satu provider AI saja; fallback Groq → OpenRouter wajib tetap berfungsi.
3. **Payment key per-tenant** — server key Midtrans tenant dienkripsi di DB, dengan fallback ke key platform. Billing subscription platform (`SubscriptionController`) dan transaksi kasir tenant (`TransactionController`) memakai jalur konfigurasi key yang terpisah tegas.
4. **Shift per-tenant, bukan per-user** — satu shift aktif dipakai bersama semua kasir dalam tenant yang sama; enforcement jam shift real-time.
5. **Media selalu lewat proxy backend** — URL Cloudflare R2 tidak boleh pernah diekspos langsung ke frontend.
6. **Webhook Midtrans**: server key harus di-set sebelum verifikasi notifikasi (urutan operasi kritis, sudah pernah jadi bug production).

### Keamanan
| Layer | Implementasi |
|---|---|
| Auth | Laravel Sanctum Bearer Token |
| Otorisasi | RoleMiddleware per route group |
| Isolasi Data | TenantScope otomatis |
| Payment Key | Server key terenkripsi di DB |
| Webhook Payment | Validasi prefix order_id + update status dalam DB transaction |
| WhatsApp Token | Server-side only (Next.js API Route), tidak pernah ke browser |
| File Upload | Validasi MIME + max 2MB, disimpan di Cloudflare R2 |
| Gambar Produk | Diproksikan via backend |
| SQL Injection | Eloquent ORM + parameter binding |

### Batasan Skalabilitas yang Diketahui (belum di-scope untuk fase ini)
- Cache/queue/session semua `database` driver — belum ada Redis.
- Tidak ada job queue — kirim WhatsApp & panggilan AI berjalan sinkron di dalam request/webhook, menahan worker PHP-FPM.
- Belum ada rate limiting/throttle di endpoint manapun (termasuk login & AI).
- Backend single instance di Railway, cold start saat idle, tidak ada horizontal scaling.

## 8. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS 3.4 (neobrutalism), Zustand 5, Axios, Framer Motion, Recharts, Lucide React |
| Backend | Laravel 11 (PHP ^8.3), MySQL 8, Laravel Sanctum, Global Scope multi-tenant, DomPDF, Maatwebsite Excel, Midtrans PHP SDK |
| AI | Groq (LLaMA 3.3 70B, primer) → OpenRouter (LLaMA 3.1 8B, fallback) |
| Payment | Midtrans Snap — production, QRIS/GoPay/OVO/VA/kartu kredit |
| Storage | Cloudflare R2 (S3-compatible), diproksikan backend |
| WhatsApp | Fonnte API, dipanggil server-side |
| Infrastruktur | Frontend di Vercel, backend di Railway (Docker + Nginx + PHP-FPM), DB Railway MySQL |

## 9. Testing & Definition of Done

- E2E: TestSprite — baseline 20/20 skenario PASSED (login, buka shift + kalkulator pecahan, checkout tunai + struk, tutup shift + rekonsiliasi, checkout tanpa shift ditolak, tombol bayar disabled saat cart kosong, search real-time, riwayat shift).
- Backend: PHPUnit (`backend/tests`).
- Sebelum fitur/perubahan besar dianggap selesai: jalankan test relevan dan/atau skill `/verify`.
- Bahasa semua teks user-facing (label UI, pesan error): Bahasa Indonesia.

## 10. Out of Scope (Fase Ini)

- Multi-outlet per tenant dengan shift terpisah per outlet (saat ini shift masih 1 per tenant).
- Rate limiting / throttling endpoint.
- Job queue & worker async untuk WhatsApp/AI.
- Redis / caching layer terpisah dari MySQL.
- Horizontal scaling backend.

## 11. Referensi

- `README.md` — dokumentasi lengkap untuk pembaca eksternal/recruiter, termasuk studi kasus tantangan teknis.
- `CLAUDE.md` — panduan kerja teknis di repo ini (wajib dibaca sebelum mengubah bagian arsitektur kunci).
