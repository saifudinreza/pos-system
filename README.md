<div align="center">

<img src="https://img.shields.io/badge/STATUS-PRODUCTION%20READY-00C851?style=for-the-badge" />

# KasirAI
## Smart Point of Sale System with AI Assistant

*Solusi kasir digital lengkap untuk UMKM Indonesia — dibangun dari nol sebagai Final Project Full Stack Bootcamp*

[![Live Demo](https://img.shields.io/badge/🚀%20LIVE%20DEMO-kasirai.vercel.app-FFD600?style=for-the-badge&logoColor=black)](https://kasirai.vercel.app/)

---

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Railway-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## Apa itu KasirAI?

KasirAI adalah aplikasi **Point of Sale (POS) berbasis web** yang dibangun untuk menyelesaikan masalah nyata UMKM Indonesia. Lebih dari sekadar aplikasi kasir — KasirAI dilengkapi **AI Assistant** yang bisa diajak bicara dalam bahasa Indonesia untuk menganalisis bisnis, memproses **pembayaran digital** via Midtrans (QRIS, GoPay, OVO), dan mengirim **struk otomatis ke WhatsApp** pelanggan.

Dibangun sebagai **Final Project Full Stack Bootcamp 2026** — dari desain, arsitektur, coding, hingga deployment production — oleh satu developer dalam waktu kurang dari 2 bulan.

> **"Saya tidak hanya belajar coding — saya membangun produk nyata yang bisa dipakai bisnis sungguhan."**

---

## Kenapa Project Ini Berbeda?

Kebanyakan project bootcamp hanya CRUD sederhana. KasirAI berbeda:

| Fitur | Tingkat Kompleksitas |
|---|---|
| Multi-tenant architecture dengan Laravel Global Scope | ⭐⭐⭐⭐⭐ |
| AI Assistant dengan dual-provider + auto fallback | ⭐⭐⭐⭐⭐ |
| Per-tenant Midtrans keys (split payment model) | ⭐⭐⭐⭐⭐ |
| Cloudflare R2 cloud storage + backend proxy (bypass SSL) | ⭐⭐⭐⭐ |
| Shift management per-tenant — custom time range + realtime enforcement | ⭐⭐⭐⭐ |
| Payment gateway webhook + stok rollback | ⭐⭐⭐⭐ |
| Server-side WhatsApp proxy (token tidak expose ke browser) | ⭐⭐⭐⭐ |
| E2E Testing dengan TestSprite (20/20 PASSED) | ⭐⭐⭐⭐ |

---

## Tech Stack

### Frontend
| Teknologi | Kegunaan |
|---|---|
| **Next.js 14** (App Router) | Framework utama — SSR, routing, API routes |
| **React 18** | UI component-based |
| **Tailwind CSS 3.4** | Styling — custom neobrutalism design system |
| **Framer Motion** | Animasi halaman, 3D card flip, spring physics |
| **Zustand 5** | Global state management (cart, auth, AI) |
| **Axios** | HTTP client dengan Bearer token interceptor |
| **Recharts** | Chart interaktif untuk dashboard analytics |
| **Lucide React** | Icon library |

### Backend
| Teknologi | Kegunaan |
|---|---|
| **Laravel 11** | REST API framework |
| **MySQL 8** | Database relasional — ACID compliant |
| **Laravel Sanctum** | Token-based authentication |
| **Laravel Global Scope** | Multi-tenant data isolation otomatis |
| **DomPDF** | Generate laporan PDF server-side |
| **Maatwebsite Excel** | Export data ke .xlsx |
| **Midtrans PHP SDK** | Payment gateway integration |

### Infrastructure & Services
| | Platform / Service |
|---|---|
| Frontend | **Vercel** + Speed Insights |
| Backend | **Railway** (Docker + Nginx + PHP-FPM) |
| Database | **Railway MySQL** |
| AI Primary | **Groq API** — LLaMA 3.3 70B (gratis & cepat) |
| AI Fallback | **OpenRouter** — LLaMA 3.1 8B (auto-switch) |
| Payment | **Midtrans Snap** — QRIS, GoPay, OVO, VA |
| Storage | **Cloudflare R2** — upload & serve foto produk (S3-compatible) |
| WhatsApp | **Fonnte API** — struk digital otomatis |

---

## Arsitektur & Keputusan Teknis

### 1. Multi-Tenant dengan Laravel Global Scope

Setiap bisnis punya data yang **100% terisolasi**. Tidak perlu tulis `WHERE tenant_id = ?` di setiap query — Global Scope menanganinya secara otomatis di semua model.

```php
// TenantScope.php — aktif di semua model: Product, Order, Shift, dll
public function apply(Builder $builder, Model $model): void
{
    if (Auth::check() && Auth::user()->tenant_id !== null) {
        $builder->where($model->getTable() . '.tenant_id', Auth::user()->tenant_id);
    }
    // Developer (tenant_id = null) → bisa lihat semua data lintas tenant
}
```

### 2. AI Dual-Provider dengan Auto Fallback

Groq sebagai provider utama (gratis, sangat cepat). Saat terkena rate limit, sistem **otomatis beralih** ke OpenRouter tanpa intervensi manual, menggunakan Laravel Cache sebagai circuit breaker.

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
            Cache::put('groq_rate_limited', true, 65); // cooldown 65 detik
            return $this->callOpenRouter($systemPrompt, $userQuery);
        }
        throw $e;
    }
}
```

### 3. Per-Tenant Payment Gateway (Split Payment Model)

Setiap tenant bisa pakai **Midtrans key mereka sendiri** — bukan key terpusat milik platform. Server Key dienkripsi di database. Client Key digunakan frontend untuk load Snap.js secara dinamis.

```php
// TransactionController.php
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

```js
// kasir/page.jsx — Snap.js dimuat dinamis dengan client key milik tenant
const loadMidtransSnap = (clientKey) => new Promise((resolve, reject) => {
    if (window.snap) return resolve();
    const script = document.createElement("script");
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ?? "https://app.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = resolve;
    document.body.appendChild(script);
});
```

### 4. Shift Management Per-Tenant dengan Realtime Enforcement

Shift bersifat **per-tenant** (bukan per-user) — satu shift aktif dipakai bersama semua kasir. User mendefinisikan sendiri nama shift dan jam berlaku. Sistem **memblokir transaksi** di luar jam shift secara realtime.

```
// Auto-resume: login saat shift masih aktif → langsung terhubung tanpa isi form
// within_window: cek jam sekarang vs start_time/end_time di backend
// Warning banner orange + transaksi diblokir kalau di luar jam shift
```

Saat tutup shift (klerk), sistem menghitung **selisih kas otomatis**:

```
Seharusnya  =  Modal Awal + Total Penjualan Tunai − Kas Kecil
Selisih     =  Saldo Fisik (dari hitung pecahan) − Seharusnya
```

### 5. Cloudflare R2 + Backend Media Proxy

Foto produk disimpan di **Cloudflare R2** (S3-compatible). Karena R2 public URL memerlukan custom domain untuk SSL, semua gambar diproksikan melalui backend Laravel — tidak ada URL R2 yang terekspos ke browser.

```php
// api.php — proxy route, tidak perlu auth
Route::get('/media/{path}', function (string $path) {
    $disk = !empty(config('filesystems.disks.r2.key')) ? 'r2' : 'public';
    if (! Storage::disk($disk)->exists($path)) abort(404);
    return Storage::disk($disk)->response($path);
})->where('path', '.*');

// ProductController.php — URL selalu via proxy backend, bukan R2 langsung
'image_url' => $product->image ? url('/api/media/' . $product->image) : null,
```

### 6. Server-side WhatsApp Proxy

Token Fonnte **tidak pernah menyentuh browser**. Frontend memanggil Next.js API Route `/api/send-whatsapp` di server, yang kemudian menghubungi Fonnte. Token hanya ada di environment variable server.

---

## Fitur Lengkap

### POS Terminal (`/kasir`)
- Split-screen: grid produk + keranjang belanja
- Search real-time dengan debounce 400ms
- Filter produk per kategori
- Validasi stok real-time saat tambah ke keranjang
- **Bayar Tunai** — kalkulasi kembalian otomatis
- **Bayar Digital** — Midtrans Snap (QRIS, GoPay, OVO, VA, Kartu Kredit)
- Struk digital → cetak / kirim WhatsApp
- Panel kelola produk langsung dari kasir (slide-over)

### Shift Management / Klerek
- Shift **per-tenant** — satu shift aktif untuk semua kasir, bukan per-user
- **Auto-resume**: login saat shift masih aktif → langsung terhubung, tidak perlu isi form lagi
- **Form buka shift** — nama shift custom + preset (Pagi/Siang/Malam) + pilih jam mulai & selesai + kalkulator denominasi (Rp100.000 s.d. Rp100) + modal awal
- **Realtime enforcement** — transaksi diblokir di luar jam shift; banner warning orange + pesan informatif
- **Info bar** — tampilkan nama shift, jam aktif, jumlah order, total penjualan langsung di kasir
- **Tutup Shift / Klerek** — 6 section: identitas, ringkasan penjualan, breakdown pembayaran, hitung kas fisik (denominasi), kas kecil, rekonsiliasi otomatis dengan indikator selisih warna
- Riwayat shift lengkap dengan laporan per-shift

### Dashboard & Analytics
- Revenue, order, stok kritis, total produk — stat cards real-time
- Line chart tren 7 hari, bar chart top produk, pie chart metode pembayaran
- 10 transaksi terbaru

### AI Assistant (Sidebar)
- Chat bahasa Indonesia — tanya apa saja tentang bisnis
- Backend inject data penjualan & stok terkini sebagai konteks AI
- 3 mode: analisis penjualan, prediksi stok habis, rekomendasi bundling
- Badge provider aktif: Groq / FALLBACK OpenRouter
- Limit harian dengan warning banner

### Laporan (`/reports`)
- Filter: hari ini, 7 hari, 30 hari, custom range
- Download **PDF** & **Excel** (generate di backend)
- Tab penjualan + tab stok

### Manajemen Produk, Kategori, Pesanan, Transaksi
- CRUD lengkap + upload foto
- Badge stok: Normal / Menipis / Habis
- Update status order, void, batalkan transaksi

### User Management & AI Monitoring
- CRUD user dengan role-based guard (Developer only)
- Dashboard monitoring penggunaan AI: token, provider, per-user quota

---

## Role & Hak Akses

| Fitur | user | kasir | admin | developer |
|---|:---:|:---:|:---:|:---:|
| POS + Shift Management | ✅ | ✅ | ✅ | ✅ |
| Kelola Produk & Kategori | — | ✅ | ✅ | ✅ |
| Pesanan & Transaksi | — | ✅ | ✅ | ✅ |
| Dashboard & Laporan | — | — | ✅ | ✅ |
| Konfigurasi Midtrans | — | — | ✅ | ✅ |
| AI Assistant | — | — | ✅ | ✅ |
| AI Monitoring | — | — | ✅ | ✅ |
| User Management | — | — | — | ✅ |

---

## Testing

Diuji menggunakan **TestSprite** — AI testing agent yang menjalankan test end-to-end di browser nyata.

**Hasil: 20/20 test PASSED** ✅

| Test Flow | Verdict |
|---|:---:|
| Login & autentikasi | ✅ PASSED |
| Buka shift dengan kalkulator pecahan | ✅ PASSED |
| Checkout tunai + struk digital | ✅ PASSED |
| Tutup shift + rekonsiliasi kas | ✅ PASSED |
| Edge: checkout tanpa shift (harus ditolak) | ✅ PASSED |
| Edge: tombol bayar disabled saat cart kosong | ✅ PASSED |
| Search produk real-time | ✅ PASSED |
| Riwayat shift | ✅ PASSED |

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

---

## Keamanan

| Layer | Implementasi |
|---|---|
| Auth | Laravel Sanctum Bearer Token |
| Otorisasi | RoleMiddleware per route group |
| Isolasi Data | TenantScope — `WHERE tenant_id = ?` otomatis |
| Payment Key | Server Key dienkripsi di DB (`encrypted` cast) |
| WhatsApp Token | Server-side only, tidak pernah ke browser |
| File Upload | Validasi MIME + max 2MB, disimpan di Cloudflare R2 |
| Gambar Produk | Diproksikan via backend — URL R2 tidak pernah terekspos ke browser |
| SQL Injection | Eloquent ORM + parameter binding |

---

## Developer

<div align="center">

<table>
  <tr>
    <td align="center" style="padding: 20px">
      <strong>Saifudin Reza</strong><br/>
      <em>Full Stack Developer</em><br/>
      <em>Final Project — Full Stack Web Development Bootcamp 2026</em><br/><br/>
      <a href="mailto:donojomi@gmail.com">donojomi@gmail.com</a>
    </td>
  </tr>
</table>

### Skills yang didemonstrasikan

`Next.js 14 App Router` `React 18` `Laravel 11` `PHP 8.3` `MySQL` `REST API Design`
`Zustand` `Tailwind CSS` `Framer Motion` `Neobrutalism Design System`
`Multi-tenant Architecture` `Laravel Sanctum` `Laravel Global Scope`
`Groq AI Integration` `OpenRouter Fallback` `LLM Rate Limiting`
`Midtrans Split Payment` `WhatsApp API` `PDF & Excel Export`
`Cloudflare R2 (S3-compatible)` `Backend Media Proxy` `Cloud Storage`
`Shift Management & Cash Reconciliation` `Realtime Time Enforcement`
`Role-based Access Control` `E2E Testing (TestSprite)` `Docker` `Vercel` `Railway`

---

**[🌐 Coba Live Demo → kasirai.vercel.app](https://kasirai.vercel.app/)**

*Dibangun dengan sepenuh hati — Mei–Juni 2026 · Production ready*

</div>
