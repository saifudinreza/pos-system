<div align="center">

# KasirAI — Point of Sale System

### Full Stack Web Application · Next.js 14 + Laravel 11 + Groq AI

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-kasirai.vercel.app-FFD600?style=for-the-badge&logoColor=black)](https://kasirai.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Aplikasi kasir digital (POS) berbasis web untuk UMKM.**  
Dibangun sebagai Final Project Full Stack Bootcamp dengan integrasi AI Assistant, payment gateway, shift management (klerek), subscription plan, dan WhatsApp API.

[🌐 Live Demo](https://kasirai.vercel.app/) · [Lihat Kode Frontend](./frontend) · [Lihat Kode Backend](./backend)

</div>

---

## Tentang Project

KasirAI adalah sistem kasir modern yang memecahkan masalah nyata UMKM:

| Masalah UMKM | Solusi di KasirAI |
|---|---|
| Struk manual, sering lupa kirim | Struk otomatis via WhatsApp (Fonnte API) |
| Tidak tahu produk terlaris | AI Assistant — tanya pakai bahasa Indonesia biasa |
| Stok sering tidak terpantau | Alert stok menipis + laporan stok real-time |
| Laporan harus buat manual di Excel | Export otomatis PDF & Excel dari backend |
| Satu sistem hanya untuk satu toko | Multi-tenant: satu aplikasi untuk banyak bisnis |
| Tidak ada kontrol penggunaan AI | Limit harian per user + monitoring dashboard untuk admin |
| Tidak ada kontrol shift kasir | Shift management (klerek) dengan rekonsiliasi kas otomatis |

---

## Tech Stack

### Frontend
| | Teknologi | Alasan Dipilih |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR, file-based routing, API routes built-in |
| UI Library | **React 18** | Component-based, ekosistem luas |
| Styling | **Tailwind CSS 3.4** | Utility-first, custom design system cepat |
| Animation | **Framer Motion** | Animasi 3D, spring physics, gesture-aware |
| State Management | **Zustand 5** | Lightweight, lebih simpel dari Redux |
| HTTP Client | **Axios** | Interceptors untuk auto-attach auth token |
| Charts | **Recharts** | Composable chart library untuk React |
| Icons | **Lucide React** | Konsisten, tree-shakeable |
| Design System | **Neobrutalism** | Bold, unik, memorable — custom built |

### Backend
| | Teknologi | Alasan Dipilih |
|---|---|---|
| Framework | **Laravel 11** | Eloquent ORM, Sanctum auth, expressive syntax |
| Database | **PostgreSQL 16** | Relasional, ACID-compliant untuk transaksi finansial |
| Auth | **Laravel Sanctum** | Token-based API auth yang ringan |
| PDF | **DomPDF** | Generate laporan PDF server-side |
| Excel | **Maatwebsite Excel** | Export data ke .xlsx |
| Payment | **Midtrans PHP SDK** | Payment gateway terpercaya di Indonesia |

### Deployment
| | Platform |
|---|---|
| Frontend | **Vercel** — `https://kasirai.vercel.app` |
| Backend | **Railway** — Docker + Nginx + PHP-FPM |
| Database | **Railway PostgreSQL** |

### External Services
| Service | Kegunaan |
|---|---|
| **Groq LLaMA 3.3 70B** | AI Assistant primary — analisis data bisnis bahasa natural, gratis & cepat |
| **OpenRouter LLaMA 3.1 8B** | AI fallback otomatis — aktif saat Groq rate-limited |
| **Midtrans Snap** | Payment gateway: QRIS, GoPay, OVO, Virtual Account, Kartu Kredit |
| **Fonnte.com** | WhatsApp API — kirim struk digital otomatis ke customer |

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (Client)                              │
│                                                                 │
│  Next.js 14 App — kasirai.vercel.app                           │
│  ├── App Router → /kasir, /dashboard, /products, ...            │
│  ├── Zustand   → cartStore, authStore, aiStore (global state)   │
│  ├── Axios     → API calls + Bearer token interceptor           │
│  └── /api/send-whatsapp → server-side proxy (token aman)        │
└───────────────────────┬─────────────────────────────────────────┘
                        │ REST API (JSON)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│               Laravel 11 API — Railway                           │
│                                                                 │
│  Middleware Stack:                                              │
│  ├── Sanctum Authentication (Bearer Token)                      │
│  ├── RoleMiddleware (admin | kasir | developer | user)          │
│  └── TenantScope (Global Scope — auto filter tenant_id)         │
│                                                                 │
│  Controllers → Models (Eloquent ORM) → PostgreSQL              │
└──────────────┬────────────────────────┬────────────────────────┘
               │                        │
   ┌───────────▼────────┐   ┌───────────▼────────────────────┐
   │  PostgreSQL DB      │   │   External Services             │
   │  (Railway)         │   │                                  │
   │  Multi-tenant data │   │  ├── Groq API (LLaMA 3.3 70B)  │
   │  isolation via     │   │  │   └── fallback: OpenRouter   │
   │  tenant_id +       │   │  ├── Midtrans (payment)         │
   │  Global Scope      │   │  └── Fonnte (WhatsApp)          │
   └────────────────────┘   └──────────────────────────────────┘
```

### Keputusan Arsitektur yang Menarik

**1. Multi-Tenant dengan Laravel Global Scope**

Setiap bisnis (tenant) punya data yang sepenuhnya terisolasi. Setiap query ke database otomatis ditambahkan `WHERE tenant_id = ?` tanpa perlu ditulis manual di setiap controller.

```php
// TenantScope.php — diterapkan di semua model: Product, Category, Order, dll
public function apply(Builder $builder, Model $model): void
{
    if (Auth::check() && Auth::user()->tenant_id !== null) {
        $builder->where($model->getTable() . '.tenant_id', Auth::user()->tenant_id);
    }
    // Role developer (tenant_id = null) → bypass, bisa lihat semua tenant
}
```

**2. AI Dual-Provider dengan Auto Fallback**

Groq dipakai sebagai provider utama (gratis, cepat). Jika Groq terkena rate limit (429), sistem otomatis beralih ke OpenRouter selama 65 detik menggunakan Laravel Cache, lalu kembali ke Groq setelah reset window selesai.

```php
// GroqService.php — auto-fallback tanpa intervensi manual
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

**3. Shift Management dengan Rekonsiliasi Kas**

Setiap kasir wajib buka shift sebelum bertransaksi. Saat tutup shift, sistem otomatis menghitung selisih kas berdasarkan formula:

```
Seharusnya = Modal Awal + Penjualan Tunai − Pengeluaran Kas Kecil
Selisih    = Saldo Fisik − Seharusnya
```

Backend memvalidasi dan menyimpan denominasi pecahan uang (Rp100.000 s.d. Rp100) untuk audit trail lengkap.

**4. Server-side WhatsApp Proxy**

Token Fonnte tidak pernah sampai ke browser. Frontend memanggil Next.js API Route `/api/send-whatsapp` yang berjalan di server, lalu server yang menghubungi Fonnte. Token hanya ada di environment variable server.

**5. Cash Payment Auto-Mark Paid**

Berbeda dari Midtrans yang butuh webhook, pembayaran tunai langsung mengubah status order ke `paid` saat kasir klik konfirmasi — tanpa roundtrip ke payment gateway.

---

## Fitur Lengkap

### Kasir / POS Terminal (`/kasir`)
- Split-screen: grid produk (kiri) + keranjang belanja (kanan)
- Search produk real-time dengan debounce 400ms
- Filter produk per kategori (tab horizontal scroll)
- Keranjang dengan kontrol quantity + validasi stok real-time
- **Bayar Tunai:** modal kembalian otomatis + tombol nominal cepat
- **Bayar Digital:** Midtrans Snap popup (QRIS, GoPay, OVO, VA, dll)
- Struk digital: tampil di layar → cetak → kirim WhatsApp otomatis ke customer
- Panel kelola produk langsung dari halaman kasir (slide-over)
- Responsive: mobile-friendly dengan drawer keranjang

### Shift Management / Klerek (`/kasir`)
- Wajib buka shift sebelum bertransaksi — backend guard di setiap order
- **Modal Buka Shift:** identitas kasir + kalkulator pecahan uang (Rp100.000–Rp100) + catatan opsional
- **Modal Tutup Shift (6 section):**
  1. Identitas shift (tanggal, nama shift, kasir, jam buka)
  2. Ringkasan penjualan (gross sales, PPN 11%, net sales, info void)
  3. Breakdown pembayaran (Tunai vs Non-Tunai + detail per metode)
  4. Hitung kas fisik (kalkulator pecahan closing + total saldo fisik)
  5. Kas kecil / pengeluaran selama shift
  6. Rekonsiliasi otomatis: Modal Awal + Tunai − Kas Kecil = Seharusnya vs Fisik → Selisih berwarna
- Riwayat semua shift dengan laporan detail per shift

### Dashboard & Analytics (`/dashboard`)
- Stat cards: total revenue, total order, produk stok kritis, total produk
- Line chart tren penjualan 7 hari terakhir
- Bar chart top produk terlaris bulan ini
- Pie chart distribusi metode pembayaran
- Tabel 10 transaksi terbaru

### AI Assistant (Sidebar kanan)
- Chat sidebar persisten — tanya dengan bahasa Indonesia biasa
- Backend otomatis mengambil data penjualan & stok terkini sebagai konteks
- 3 mode analisis: **Sales Analysis**, **Prediksi Stok**, **Rekomendasi Produk**
- Quick prompts: produk terlaris, stok mau habis, rekomendasi bundling
- Typing indicator saat AI generate jawaban
- Indikator provider aktif: badge "Groq" atau "FALLBACK OpenRouter"
- **Warning banner** saat kuota harian hampir habis (≤30% sisa)
- **Limit banner** saat kuota harian habis sepenuhnya

### Manajemen Produk (`/products`)
- CRUD lengkap + upload foto (JPG/PNG/WebP, maks 2MB)
- Auto-generate SKU dari nama produk
- Toggle aktif/nonaktif produk dari tabel
- Filter: status, kategori, stok rendah
- Badge stok: Normal / Menipis / Habis

### Laporan (`/reports`) — Admin & Developer
- **Tab Penjualan:** total revenue, jumlah transaksi, rata-rata, produk terjual
- Filter periode: hari ini, 7 hari, 30 hari, bulanan, custom date range
- Line chart tren harian + tabel top produk dengan % kontribusi revenue
- **Tab Stok:** total produk aktif, stok menipis, stok habis, nilai total stok
- Download laporan: **PDF** & **Excel** (generate di backend)

### AI Monitoring Dashboard (`/ai-monitoring`) — Admin & Developer
- Total request, total token, user aktif hari ini
- Alert token tinggi jika melewati threshold
- Stat mingguan & bulanan, breakdown per tipe query & per provider
- Tabel per-user dengan progress bar kuota + badge status

### User Management, Pesanan, Transaksi, Profil & Subscription
- CRUD user dengan role-based access (Developer only)
- Riwayat order & transaksi dengan filter status & tanggal
- Upgrade subscription via Midtrans payment

---

## Role & Akses

| Fitur | user | kasir | admin | developer |
|---|:---:|:---:|:---:|:---:|
| Kasir (buat order + shift) | ✅ | ✅ | ✅ | ✅ |
| Lihat produk & kategori | ✅ | ✅ | ✅ | ✅ |
| CRUD produk & kategori | — | ✅ | ✅ | ✅ |
| Kelola pesanan & transaksi | — | ✅ | ✅ | ✅ |
| Dashboard & laporan | — | — | ✅ | ✅ |
| AI Assistant | — | — | ✅ | ✅ |
| AI Monitoring | — | — | ✅ | ✅ |
| User Management | — | — | — | ✅ |
| Dev panel (subscriptions) | — | — | — | ✅ |

> AI Assistant juga bisa diakses oleh user dengan subscription **Pro** atau **Enterprise**

---

## Database Schema

```
tenants
  id, name, slug, subscription_plan (free|pro|enterprise), timestamps

users
  id, tenant_id, name, email, password, role (admin|kasir|user|developer),
  phone, is_active, subscription_plan, timestamps

categories
  id, tenant_id, name, slug, is_active, timestamps

products
  id, tenant_id, category_id, name, sku, price, stock, stock_alert,
  image, is_active, timestamps

shifts
  id, tenant_id, user_id, shift_number, shift_name (Pagi|Siang|Malam),
  status (open|closed), opened_at, closed_at,
  opening_balance, opening_note, opening_denominations (JSON),
  closing_balance, closing_denominations (JSON),
  expected_balance, difference,
  petty_cash, petty_cash_note, notes, verified_by, timestamps

orders
  id, tenant_id, user_id, shift_id, order_number,
  status (pending|paid|cancelled|void),
  subtotal, tax, total, payment_method, customer_phone, notes, timestamps

order_items
  id, order_id, product_id, quantity, price (snapshot harga saat beli), subtotal

transactions
  id, order_id, snap_token, payment_method, status, amount, paid_at, timestamps

subscriptions
  id, user_id, tenant_id, snap_token, status, plan, amount, paid_at, timestamps

ai_query_logs
  id, user_id, type (sales_analysis|stock_prediction|recommendation),
  query, response, tokens_used, provider (groq|openrouter), timestamps

ai_chat_usage
  id, user_id, usage_date, count
  [unique: user_id + usage_date]
```

---

## API Endpoints

```
Auth
  POST   /api/register                    → daftar + otomatis buat tenant baru
  POST   /api/login                       → login → dapat Bearer token
  POST   /api/logout                      → logout (hapus token)
  GET    /api/me                          → data user yang sedang login
  PUT    /api/profile                     → update profil sendiri

Shifts (Klerek)
  GET    /api/shifts/current              → shift aktif user + saran shift berikutnya
  POST   /api/shifts/open                 → buka shift baru (dengan modal awal + denominasi)
  POST   /api/shifts/{id}/close           → tutup shift (dengan denominasi + kas kecil)
  GET    /api/shifts/{id}/report          → laporan detail shift (sales, payment, kas)
  GET    /api/shifts                      → riwayat semua shift

Products
  GET    /api/products                    → list (filter: search, category, status, stok)
  POST   /api/products                    → tambah + upload foto [Admin]
  PUT    /api/products/{id}               → update [Admin]
  DELETE /api/products/{id}               → hapus [Admin]

Orders
  POST   /api/orders                      → buat order (wajib ada shift aktif)
  GET    /api/orders                      → list semua order [Kasir+]
  GET    /api/orders/{id}                 → detail order
  PATCH  /api/orders/{id}/status          → update status [Kasir+]

Transactions
  POST   /api/transactions                → buat transaksi → dapat snap_token Midtrans
  GET    /api/transactions                → list semua [Kasir+]
  PATCH  /api/transactions/{id}/cancel    → batalkan [Admin]
  POST   /api/webhook/midtrans            → webhook dari server Midtrans (public)

Reports [Admin+]
  GET    /api/reports/sales               → data penjualan (filter periode)
  GET    /api/reports/stock               → kondisi stok semua produk
  GET    /api/reports/sales/download      → ?format=pdf|excel
  GET    /api/reports/stock/download      → ?format=pdf|excel

AI Assistant [Admin+]
  POST   /api/ai/query                    → analisis penjualan bahasa natural
  POST   /api/ai/predict-stock            → prediksi kapan stok habis
  POST   /api/ai/recommend               → rekomendasi produk / bundling
  GET    /api/ai/usage-today              → kuota hari ini
  GET    /api/ai/stats                    → monitoring usage LLM [Admin]
```

---

## Testing

Project ini diuji menggunakan **TestSprite** — AI testing agent yang menjalankan test end-to-end secara otomatis di browser.

**Hasil: 20/20 test PASSED** (termasuk 8 test flow utama + 12 test UI/auth)

| Flow | Verdict |
|---|---|
| Kasir login | ✅ PASSED |
| Buka shift dengan kalkulator pecahan | ✅ PASSED |
| Checkout tunai + struk digital | ✅ PASSED |
| Tutup shift + rekonsiliasi kas | ✅ PASSED |
| Edge case: checkout tanpa shift (harus error) | ✅ PASSED |
| Edge case: tombol bayar disabled saat cart kosong | ✅ PASSED |
| Search produk real-time | ✅ PASSED |
| Riwayat shift | ✅ PASSED |

---

## Cara Menjalankan di Local

### Prasyarat
- PHP 8.3+, Composer
- Node.js 18+, npm
- PostgreSQL (atau MySQL 8)

### 1. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env

# Edit .env — isi nilai berikut:
# DB_CONNECTION=pgsql
# DB_DATABASE=kasirai
# DB_USERNAME=postgres
# DB_PASSWORD=
# GROQ_API_KEY=gsk_...          ← dari console.groq.com (gratis)
# MIDTRANS_SERVER_KEY=SB-Mid-...
# MIDTRANS_CLIENT_KEY=SB-Mid-...

php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### 2. Frontend (Next.js)

```bash
cd frontend
npm install

# Buat .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
# NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
# FONNTE_TOKEN=...              ← dari fonnte.com

npm run dev
```

Akses di `http://localhost:3000`

---

## Keamanan

| Layer | Implementasi |
|---|---|
| Autentikasi | Laravel Sanctum — Bearer token wajib di semua endpoint protected |
| Otorisasi | RoleMiddleware per route group + guard ownership di controller |
| Isolasi data | TenantScope — `WHERE tenant_id = ?` otomatis di setiap query |
| File upload | Validasi MIME type (JPG/PNG/WebP) + max size 2MB di backend |
| Secret API | Fonnte token disimpan server-side (tidak pernah ke browser) |
| Payment | Midtrans webhook diverifikasi dengan signature key dari Midtrans |
| SQL Injection | Dilindungi Eloquent ORM + parameter binding Laravel |

---

## Developer

<table>
  <tr>
    <td align="center">
      <strong>Saifudin Reza</strong><br/>
      Full Stack Developer<br/>
      <em>Final Project — Full Stack Web Development Bootcamp 2026</em><br/><br/>
      <a href="mailto:donojomi@gmail.com">donojomi@gmail.com</a>
    </td>
  </tr>
</table>

**Skills yang didemonstrasikan dalam project ini:**

`Next.js 14` `React 18` `Laravel 11` `PHP 8.3` `PostgreSQL` `REST API Design`  
`Zustand` `Tailwind CSS` `Framer Motion` `Neobrutalism Design System` `Multi-tenant Architecture`  
`Laravel Sanctum` `Laravel Global Scope` `Groq AI Integration` `OpenRouter Fallback`  
`LLM Rate Limiting & Monitoring` `Midtrans Payment Gateway` `WhatsApp API (Fonnte)`  
`Shift Management & Cash Reconciliation` `PDF & Excel Generation` `Role-based Access Control`  
`E2E Testing (TestSprite)` `Vercel Deployment` `Railway + Docker Deployment`

---

<div align="center">

**[🌐 Live Demo → kasirai.vercel.app](https://kasirai.vercel.app/)**

*Dibangun dengan sepenuh hati sebagai Final Project Bootcamp — Mei–Juni 2026*

</div>
