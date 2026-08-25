<div align="center">

<img src="https://img.shields.io/badge/STATUS-PRODUCTION%20READY-00C851?style=for-the-badge" />

# KasirAI
## SaaS Point of Sale dengan AI Assistant untuk UMKM Indonesia

*Bukan sekadar CRUD bootcamp, ini produk SaaS multi-tenant nyata: ada landing page, paket harga, pembayaran langganan, dan puluhan tenant bisa jalan berdampingan di satu instance yang sama.*

[![Live Demo](https://img.shields.io/badge/%20LIVE%20DEMO-sikasirai.com-FFD600?style=for-the-badge&logoColor=black)](https://sikasirai.com/)

---

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Render-46E3B7?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## Untuk Recruiter, TL;DR 30 Detik

- **Full-stack production app**, bukan tutorial project: multi-tenant SaaS, payment gateway asli (bukan sandbox iseng), AI terintegrasi ke data bisnis real-time, dan sudah live dipakai lewat demo publik.
- Dikerjakan **solo, dari nol sampai deploy**, sebagai final project Full Stack Web Development Bootcamp 2026, desain, database, backend API, frontend, integrasi pihak ketiga, testing, sampai infrastruktur produksi.
- Bagian paling layak dilihat kalau waktu terbatas: **[Tantangan Teknis & Solusi](#tantangan-teknis--solusi-yang-saya-hadapi)**, di situ terlihat cara berpikir saat debugging masalah production yang tidak diajarkan langsung di kelas.

---

## Apa itu KasirAI?

KasirAI adalah **SaaS Point of Sale (POS)** berbasis web untuk UMKM Indonesia. Setiap toko yang daftar jadi satu *tenant* terisolasi dengan datanya sendiri, bisa langsung pakai kasir, kelola stok, terima pembayaran digital via Midtrans (QRIS, GoPay, OVO), kirim struk otomatis ke WhatsApp pelanggan, dan tanya-jawab soal bisnisnya ke **AI Assistant** berbahasa Indonesia. Ada landing page publik, paket harga (Free/Pro/Enterprise), dan alur upgrade langganan yang dibayar sungguhan lewat Midtrans.

> **"Saya tidak hanya belajar coding, saya membangun produk SaaS yang punya model bisnis, bukan cuma fitur."**

---

## Kenapa Project Ini Berbeda?

Kebanyakan project bootcamp berhenti di CRUD. KasirAI melangkah lebih jauh ke arah produk SaaS yang bisa dijual:

| Fitur | Tingkat Kompleksitas |
|---|---|
| Multi-tenant architecture dengan Laravel Global Scope |  |
| Subscription billing (Free/Pro/Enterprise) via Midtrans + webhook |  |
| AI Assistant dengan dual-provider + auto fallback |  |
| Per-tenant Midtrans keys (split payment model) |  |
| Cloudflare R2 cloud storage + backend proxy (bypass SSL) |  |
| Shift management per-tenant, custom time range + realtime enforcement |  |
| Landing page marketing dengan Framer Motion (parallax, reveal, stagger) |  |
| Server-side WhatsApp proxy (token tidak expose ke browser) |  |
| E2E Testing dengan TestSprite (20/20 PASSED) |  |

---

## Tech Stack

### Frontend
| Teknologi | Kegunaan |
|---|---|
| **Next.js 14** (App Router) | Framework utama, SSR, routing, API routes |
| **React 18** | UI component-based |
| **Tailwind CSS 3.4** | Styling, custom neobrutalism design system |
| **Framer Motion** | Animasi halaman, landing page (parallax/reveal/stagger), 3D card flip |
| **Zustand 5** | Global state management (cart, auth, AI, subscription) |
| **Axios** | HTTP client dengan Bearer token interceptor |
| **Recharts** | Chart interaktif untuk dashboard analytics |
| **Lucide React** | Icon library |

### Backend
| Teknologi | Kegunaan |
|---|---|
| **Laravel 11** | REST API framework |
| **MySQL 8** | Database relasional, ACID compliant |
| **Laravel Sanctum** | Token-based authentication |
| **Laravel Global Scope** | Multi-tenant data isolation otomatis |
| **DomPDF** | Generate laporan PDF server-side |
| **Maatwebsite Excel** | Export data ke .xlsx |
| **Midtrans PHP SDK** | Payment gateway, transaksi kasir & subscription billing |

### Infrastructure & Services
| | Platform / Service |
|---|---|
| Frontend | **Vercel** + Speed Insights |
| Backend | **Render** (Docker + Nginx + PHP-FPM) |
| Database | **TiDB Cloud MySQL** |
| AI Primary | **Groq API**, LLaMA 3.3 70B (gratis & cepat) |
| AI Fallback | **OpenRouter**, LLaMA 3.1 8B (auto-switch) |
| Payment | **Midtrans Snap (Production)**, QRIS, GoPay, OVO, VA, kartu kredit |
| Storage | **Cloudflare R2**, upload & serve foto produk (S3-compatible) |
| WhatsApp | **Fonnte API**, struk digital otomatis |
| Analytics & SEO | **Google Analytics 4**, sitemap/robots/OG image di-generate dinamis (Next.js Metadata API) |
| Domain | **sikasirai.com** (custom domain), DNS dikelola manual via Domainesia |

---

## Tantangan Teknis & Solusi yang Saya Hadapi

Bagian ini merangkum masalah nyata yang muncul saat membangun & men-deploy KasirAI ke production, dan bagaimana saya menyelesaikannya.

### 1. "Bagaimana isolasi data ratusan tenant tanpa lupa `WHERE tenant_id` di satu query pun?"

**Masalah:** Kalau isolasi tenant ditulis manual di setiap controller, satu query yang lupa filter tenant = kebocoran data pelanggan lain. Ini fatal untuk SaaS.

**Solusi:** Laravel **Global Scope** (`TenantScope`) yang otomatis inject `WHERE tenant_id = ?` ke semua model tenant-aware, di level query builder, bukan di controller. Developer (role khusus, `tenant_id = null`) tetap bisa melihat lintas tenant untuk keperluan support/monitoring.

```php
// TenantScope.php, aktif otomatis di semua model: Product, Order, Shift, dll
public function apply(Builder $builder, Model $model): void
{
    if (Auth::check() && Auth::user()->tenant_id !== null) {
        $builder->where($model->getTable() . '.tenant_id', Auth::user()->tenant_id);
    }
}
```

### 2. "AI gratisan (Groq) kena rate limit di jam sibuk, apa fitur AI harus mati?"

**Masalah:** Groq API gratis dan cepat, tapi ada limit request per menit. Kalau limit kena saat tenant lagi butuh, fitur AI Assistant langsung error ke user.

**Solusi:** Dual-provider dengan **circuit breaker pattern** pakai Laravel Cache. Saat Groq melempar error rate-limit, sistem set flag cooldown 65 detik dan otomatis alihkan semua request ke OpenRouter tanpa user sadar ada masalah, tanpa perlu restart atau intervensi manual.

```php
public function ask(string $systemPrompt, string $userQuery): array
{
    if (Cache::get('groq_rate_limited', false)) {
        return $this->callOpenRouter($systemPrompt, $userQuery);
    }
    try {
        return $this->callGroq($systemPrompt, $userQuery);
    } catch (\Exception $e) {
        if ($this->isRateLimitError($e)) {
            Cache::put('groq_rate_limited', true, 65);
            return $this->callOpenRouter($systemPrompt, $userQuery);
        }
        throw $e;
    }
}
```

### 3. "Tiap tenant mau terima uang ke rekening Midtrans-nya sendiri, bukan rekening developer."

**Masalah:** Model payment gateway biasa cuma punya satu server key terpusat, semua uang masuk ke satu akun. Untuk SaaS multi-merchant, tiap tenant butuh split payment ke akun Midtrans masing-masing, dan credential itu sensitif.

**Solusi:** Server key per-tenant disimpan **terenkripsi** di database (`encrypted` cast Eloquent), dengan fallback ke key platform kalau tenant belum setting sendiri. Client key dikirim ke frontend untuk load Snap.js secara dinamis per tenant.

```php
private function configureServerKey(Request $request): void
{
    $serverKey = $request->user()->tenant?->midtrans_server_key
        ?? config('services.midtrans.server_key');

    if (empty($serverKey)) {
        abort(422, 'Midtrans belum dikonfigurasi. Atur key di halaman Profil.');
    }
    Config::$serverKey = $serverKey;
}
```

### 4. "Setelah pindah dari sandbox ke Midtrans production, alur upgrade langganan malah gagal untuk sebagian tenant."

**Masalah:** Saat migrasi ke Midtrans production, konfigurasi key campur antara key platform (untuk billing subscription internal) dan key per-tenant (untuk transaksi kasir tenant), keduanya sempat saling menimpa sehingga webhook subscription tidak match dengan konteks Midtrans yang benar.

**Solusi:** Dipisah tegas dua jalur konfigurasi Midtrans: `SubscriptionController` selalu pakai server key **platform** (karena yang menagih adalah KasirAI, bukan tenant), sementara `TransactionController` resolve key **per-tenant** saat runtime. Webhook subscription juga difilter berdasar prefix `order_id` (`SUB-`) supaya tidak pernah tercampur dengan notifikasi transaksi kasir tenant manapun.

### 5. "Foto produk disimpan di Cloudflare R2, tapi browser menolak load karena masalah SSL/CORS di custom domain."

**Masalah:** R2 public URL butuh custom domain + sertifikat sendiri untuk bisa diakses langsung dari browser dengan aman, tidak praktis untuk skala kecil dan menambah biaya infrastruktur.

**Solusi:** Semua request gambar diproksikan lewat **backend Laravel**, jadi URL R2 asli tidak pernah terekspos ke publik dan tidak butuh domain SSL tambahan.

```php
Route::get('/media/{path}', function (string $path) {
    $disk = !empty(config('filesystems.disks.r2.key')) ? 'r2' : 'public';
    if (! Storage::disk($disk)->exists($path)) abort(404);
    return Storage::disk($disk)->response($path);
})->where('path', '.*');
```

### 6. "Satu toko punya banyak kasir bergantian shift, gimana caranya transaksi tetap tercatat rapi tanpa kasir harus login ulang tiap ganti orang?"

**Masalah:** Shift biasanya didesain per-user. Tapi realita warung/toko: satu perangkat kasir dipakai bergantian, dan pemilik ingin satu shift aktif yang dipakai bersama, dengan jam operasional yang bisa mereka atur sendiri (bukan hardcode 8 jam).

**Solusi:** Shift dibuat **per-tenant** (bukan per-user), dengan jam mulai/selesai custom yang didefinisikan pemilik toko. Sistem melakukan **realtime enforcement**, transaksi otomatis diblokir kalau di luar jam shift, lengkap dengan banner peringatan. Saat login dan shift masih dalam jam aktif, sistem **auto-resume** tanpa perlu isi ulang form buka shift. Saat tutup shift, selisih kas dihitung otomatis dari kalkulator pecahan uang fisik.

```
Seharusnya  =  Modal Awal + Total Penjualan Tunai − Kas Kecil
Selisih     =  Saldo Fisik (dari hitung pecahan) − Seharusnya
```

### 7. "Token WhatsApp dan Server Key Midtrans tidak boleh pernah terlihat di DevTools browser."

**Masalah:** Kalau dipanggil langsung dari client, token pihak ketiga bisa dicuri lewat Network tab browser siapa saja.

**Solusi:** Kedua integrasi selalu lewat lapisan server, WhatsApp lewat **Next.js API Route** (token di env server Next.js), Midtrans server key hanya pernah dipakai di controller Laravel, tidak pernah dikirim ke response API.

### 8. "Webhook Midtrans untuk tenant yang pakai server key sendiri diam-diam selalu gagal, status transaksi tidak pernah ter-update otomatis."

**Masalah:** SDK `midtrans/midtrans-php` versi yang dipakai ternyata **memanggil balik API Midtrans** (`Transaction::status()`) di dalam constructor `Notification`, memakai `Config::$serverKey` yang aktif saat itu, bukan sekadar mencocokkan hash signature secara lokal seperti dugaan awal. Karena `webhook()` tidak pernah set server key sebelum verifikasi, request selalu memakai key default platform, sehingga verifikasi gagal total untuk tenant yang pakai Midtrans sendiri.

**Solusi:** Sebelum bikin instance `Notification`, sistem cari dulu `Transaction` + `tenant` pemiliknya dari `order_id` mentah di body request, lalu set `Config::$serverKey` sesuai tenant tersebut. Diverifikasi dengan simulasi notifikasi nyata (server key custom vs default) sebelum dinyatakan beres, bukan cuma asumsi dari membaca kode.

```php
// TransactionController::webhook(), urutan ini krusial
$transaction = Transaction::with('order.tenant')
    ->where('midtrans_order_id', $request->input('order_id'))
    ->first();

$this->configureServerKeyForTenant($transaction->order?->tenant); // set key dulu
$notification = new Notification(); // baru verifikasi, SDK panggil API pakai key di atas
```

### 9. "AI Assistant ditanya 'penjualan minggu ini?' tapi selalu jawab angka bulanan."

**Masalah:** Backend cuma pernah menghitung satu rentang waktu (`whereMonth`) dan mengirimnya ke LLM apa pun pertanyaan user. AI tidak salah paham bahasa, dia memang cuma pernah dikasih satu angka, jadi terpaksa "menebak" label periode yang diminta.

**Solusi:** Hitung 3 rentang waktu sekaligus (hari ini/minggu ini/bulan ini, pakai `whereBetween` bukan `whereMonth`) dan kirim semuanya ke LLM dengan instruksi eksplisit untuk mencocokkan periode sesuai kata di pertanyaan user. Divalidasi dengan skenario nyata: buat transaksi dummy di 3 rentang waktu berbeda, tanya AI satu-satu, pastikan jawabannya berbeda dan sesuai, bukan cuma percaya kode "kelihatan benar".

---

## Fitur Lengkap

### Landing Page & Onboarding
- Halaman marketing publik: Hero, Problem, Features, How It Works, AI Spotlight, Testimonials, Pricing, CTA
- Animasi scroll (parallax, reveal, stagger) dengan Framer Motion
- Alur daftar → pilih paket → dashboard, siap dipakai calon pelanggan asli

### Subscription & Billing (SaaS Model)
- 3 paket dengan harga **terpusat di backend** (`SubscriptionController::PRICES`), frontend membaca angka yang sama saat initiate, jadi tidak mungkin mis-match:
  - **Free** (Rp 0): 1 outlet, maks. 50 produk & 15 kategori, transaksi tanpa batas, 5 prompt AI/bulan, pembayaran tunai saja (tanpa QRIS/digital, tanpa export PDF/Excel)
  - **Pro**, Rp 129.000/bulan (Rp 100.000/bulan jika bayar tahunan): produk/kategori unlimited, transaksi tak terbatas, AI Assistant 10 prompt/hari, export laporan PDF/Excel, QRIS & e-wallet
  - **Enterprise**, Rp 499.000/bulan (Rp 399.000/bulan jika bayar tahunan): semua fitur Pro + AI Assistant 50 prompt/hari, outlet unlimited, API & integrasi kustom, account manager, SLA
- **Enforcement berlapis**: backend memblokir (QRIS free → 422 `plan_required`, export free → 403, AI free > 5/bulan → 429 `limit_reached`), frontend juga memblokir/menyembunyikan tombolnya
- **Kasir mengikuti plan admin tenant-nya** (`effective_plan` di response `/me`), bukan plan kolom user sendiri
- Upgrade paket dibayar langsung via **Midtrans Snap** (bulanan/tahunan, harga tahunan diskon)
- Webhook otomatis aktivasi paket + upgrade role user begitu pembayaran `settlement`
- User bisa batalkan transaksi pending sendiri; developer bisa monitor semua tenant, ubah plan, atau suspend akun dari panel khusus

### POS Terminal (`/kasir`)
- Split-screen: grid produk + keranjang belanja
- Search real-time dengan debounce 400ms, filter per kategori
- Validasi stok real-time saat tambah ke keranjang
- **Bayar Tunai**, kalkulasi kembalian otomatis
- **Bayar Digital**, Midtrans Snap (QRIS, GoPay, OVO, VA, Kartu Kredit)
- Struk digital → cetak / kirim WhatsApp
- Panel kelola produk langsung dari kasir (slide-over)

### Shift Management / Klerek
- Shift **per-tenant**, satu shift aktif dipakai bersama semua kasir
- **Auto-resume** saat login dalam jam shift aktif
- Form buka shift: nama custom + preset (Pagi/Siang/Malam) + jam custom + kalkulator denominasi + modal awal
- **Realtime enforcement**, transaksi diblokir di luar jam shift
- Tutup shift 6 section: identitas, ringkasan penjualan, breakdown pembayaran, hitung kas fisik, kas kecil, rekonsiliasi otomatis dengan indikator selisih warna
- Riwayat shift lengkap per-shift

### Dashboard & Analytics
- Revenue, order, stok kritis, total produk, stat cards real-time
- Line chart tren 7 hari, bar chart top produk, pie chart metode pembayaran
- 10 transaksi terbaru

### AI Assistant (Sidebar)
- Chat bahasa Indonesia, tanya apa saja tentang bisnis
- **Sadar periode waktu**, data penjualan dihitung terpisah per hari ini/minggu ini/bulan ini di setiap request, jadi AI tidak salah kira konteks waktu yang ditanya user
- Backend inject katalog & stok produk lengkap sebagai konteks AI (bukan cuma ringkasan)
- 3 mode: analisis penjualan, prediksi stok habis, rekomendasi bundling
- Badge provider aktif: Groq / FALLBACK OpenRouter
- **Kuota AI per paket** (Free dihitung per bulan kalender, Pro/Enterprise per hari): Free = 5 prompt/bulan (badge peringatan saat sisa tipis), Pro = 10 prompt/hari, Enterprise = 50 prompt/hari, tersedia untuk admin & kasir

### Laporan (`/reports`)
- Filter: hari ini, 7 hari, 30 hari, custom range
- Download **PDF** & **Excel** (generate di backend)
- Tab penjualan + tab stok

### Manajemen Produk, Kategori, Pesanan, Transaksi
- CRUD lengkap + upload foto
- Badge stok: Normal / Menipis / Habis
- Update status order, void, batalkan transaksi

### User & Tenant Management, AI Monitoring
- CRUD user dengan role-based guard (Developer only)
- Panel developer: monitor semua tenant & status langganan, ubah plan, suspend/aktifkan akun
- Dashboard monitoring penggunaan AI: token, provider, per-user quota

---

## Role & Hak Akses

| Fitur | user | kasir | admin | developer |
|---|:---:|:---:|:---:|:---:|
| POS + Shift Management |  |  |  |  |
| Kelola Produk & Kategori |, |  |  |  |
| Pesanan & Transaksi |, |  |  |  |
| Dashboard & Laporan |, |, |  |  |
| Konfigurasi Midtrans |, |, |  |  |
| AI Assistant |, |  |  |  |
| AI Monitoring |, |, |  |  |
| User Management |, |, |, |  |
| Kelola Tenant & Subscription (semua toko) |, |, |, |  |

---

## Testing

Diuji menggunakan **TestSprite**, AI testing agent yang menjalankan test end-to-end di browser nyata.

**Hasil TestSprite: 20/20 test PASSED** 

| Test Flow | Verdict |
|---|:---:|
| Login & autentikasi |  PASSED |
| Buka shift dengan kalkulator pecahan |  PASSED |
| Checkout tunai + struk digital |  PASSED |
| Tutup shift + rekonsiliasi kas |  PASSED |
| Edge: checkout tanpa shift (harus ditolak) |  PASSED |
| Edge: tombol bayar disabled saat cart kosong |  PASSED |
| Search produk real-time |  PASSED |
| Riwayat shift |  PASSED |

**PHPUnit (backend): 22/22 test PASSED** , `php artisan test` di folder `backend/` (memakai SQLite :memory:, termasuk test isolasi tenant AI/report, shift per-tenant, gating plan Free vs Pro (kuota AI harian & bulanan), dan sinkronisasi harga paket).

---

## Cara Menjalankan Lokal

### Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env

# Isi .env:
# DB_CONNECTION=mysql
# DB_DATABASE=kasirai
# GROQ_API_KEY=gsk_...
# MIDTRANS_SERVER_KEY=Mid-server-...      # production (SB-Mid-server-... untuk sandbox)
# MIDTRANS_CLIENT_KEY=Mid-client-...      # production (SB-Mid-client-... untuk sandbox)
# MIDTRANS_IS_PRODUCTION=true

php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### Frontend (Next.js)

```bash
cd frontend
npm install

# Buat .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
# NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-...
# NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.midtrans.com/snap/snap.js
# FONNTE_TOKEN=...

npm run dev
```

> Ada juga `dev.ps1` di root repo untuk menjalankan backend & frontend sekaligus di Windows.

---

## Keamanan

| Layer | Implementasi |
|---|---|
| Auth | Laravel Sanctum Bearer Token |
| Otorisasi | RoleMiddleware per route group |
| Isolasi Data | TenantScope, `WHERE tenant_id = ?` otomatis |
| Payment Key | Server Key dienkripsi di DB (`encrypted` cast) |
| Webhook Payment | Validasi prefix order_id + update status dalam DB transaction |
| WhatsApp Token | Server-side only, tidak pernah ke browser |
| File Upload | Validasi MIME + max 2MB, disimpan di Cloudflare R2 |
| Gambar Produk | Diproksikan via backend, URL R2 tidak pernah terekspos ke browser |
| SQL Injection | Eloquent ORM + parameter binding |

---

## Developer

<div align="center">

<table>
  <tr>
    <td align="center" style="padding: 20px">
      <strong>Saifudin Reza</strong><br/>
      <em>Full Stack Developer</em><br/>
      <em>Final Project, Full Stack Web Development Bootcamp 2026</em><br/><br/>
      <a href="mailto:donojomi@gmail.com">donojomi@gmail.com</a>
    </td>
  </tr>
</table>

### Skills yang didemonstrasikan

`Next.js 14 App Router` `React 18` `Laravel 11` `PHP 8.3` `MySQL` `REST API Design`
`Zustand` `Tailwind CSS` `Framer Motion` `Neobrutalism Design System`
`Multi-tenant Architecture` `Laravel Sanctum` `Laravel Global Scope`
`SaaS Subscription Billing` `Groq AI Integration` `OpenRouter Fallback` `LLM Rate Limiting`
`Midtrans Split Payment (Production)` `WhatsApp API` `PDF & Excel Export`
`Cloudflare R2 (S3-compatible)` `Backend Media Proxy` `Cloud Storage`
`Shift Management & Cash Reconciliation` `Realtime Time Enforcement`
`Role-based Access Control` `E2E Testing (TestSprite)` `Docker` `Vercel` `Render`

---

**[Coba Live Demo → sikasirai.com](https://sikasirai.com)**

*Dibangun dengan sepenuh hati, Mei 2026–sekarang · Production ready*

</div>
