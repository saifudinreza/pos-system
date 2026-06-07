<div align="center">

# KasirAI — Point of Sale System

### Full Stack Web Application · Next.js 14 + Laravel 11 + Groq AI

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Aplikasi kasir digital (POS) berbasis web untuk UMKM.**  
Dibangun sebagai Final Project Full Stack Bootcamp dengan integrasi AI Assistant, payment gateway, subscription plan, dan WhatsApp API.

[Lihat Kode Frontend](./frontend) · [Lihat Kode Backend](./backend)

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

---

## Tech Stack

### Frontend
| | Teknologi | Alasan Dipilih |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR, file-based routing, API routes built-in |
| UI Library | **React 18** | Component-based, ekosistem luas |
| Styling | **Tailwind CSS 3.4** | Utility-first, custom design system cepat |
| State Management | **Zustand 5** | Lightweight, lebih simpel dari Redux |
| HTTP Client | **Axios** | Interceptors untuk auto-attach auth token |
| Charts | **Recharts** | Composable chart library untuk React |
| Icons | **Lucide React** | Konsisten, tree-shakeable |
| Design System | **Neobrutalism** | Bold, unik, memorable — custom built |

### Backend
| | Teknologi | Alasan Dipilih |
|---|---|---|
| Framework | **Laravel 11** | Eloquent ORM, Sanctum auth, expressive syntax |
| Database | **MySQL 8** | Relasional, ACID-compliant untuk transaksi finansial |
| Auth | **Laravel Sanctum** | Token-based API auth yang ringan |
| PDF | **DomPDF** | Generate laporan PDF server-side |
| Excel | **Maatwebsite Excel** | Export data ke .xlsx |
| Payment | **Midtrans PHP SDK** | Payment gateway terpercaya di Indonesia |

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
│  Next.js 14 App (localhost:3000)                                │
│  ├── App Router → /kasir, /dashboard, /products, ...            │
│  ├── Zustand   → cartStore, authStore, aiStore (global state)   │
│  ├── Axios     → API calls + Bearer token interceptor           │
│  └── /api/send-whatsapp → server-side proxy (token aman)        │
└───────────────────────┬─────────────────────────────────────────┘
                        │ REST API (JSON)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│               Laravel 11 API (localhost:8000)                    │
│                                                                 │
│  Middleware Stack:                                              │
│  ├── Sanctum Authentication (Bearer Token)                      │
│  ├── RoleMiddleware (admin | kasir | developer | user)          │
│  └── TenantScope (Global Scope — auto filter tenant_id)         │
│                                                                 │
│  Controllers → Models (Eloquent ORM) → MySQL                   │
└──────────────┬────────────────────────┬────────────────────────┘
               │                        │
   ┌───────────▼────────┐   ┌───────────▼────────────────────┐
   │  MySQL Database     │   │   External Services             │
   │                    │   │                                  │
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
        return $this->callOpenRouter($systemPrompt, $userQuery); // fallback aktif
    }
    try {
        return $this->callGroq($systemPrompt, $userQuery);
    } catch (\Exception $e) {
        if ($this->isRateLimitError($e)) {
            Cache::put('groq_rate_limited', true, 65); // tandai 65 detik
            return $this->callOpenRouter($systemPrompt, $userQuery);
        }
        throw $e;
    }
}
```

**3. Server-side WhatsApp Proxy**

Token Fonnte tidak pernah sampai ke browser. Frontend memanggil Next.js API Route `/api/send-whatsapp` yang berjalan di server Node.js, lalu server yang menghubungi Fonnte. Token hanya ada di environment variable server (`FONNTE_TOKEN` — bukan `NEXT_PUBLIC_`).

**4. Cash Payment Auto-Mark Paid**

Berbeda dari Midtrans yang butuh webhook dari server Midtrans, pembayaran tunai langsung mengubah status order ke `paid` saat kasir klik konfirmasi — tanpa roundtrip ke payment gateway.

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

### Manajemen Kategori (`/categories`)
- CRUD kategori
- Toggle aktif/nonaktif
- Dipakai sebagai filter di kasir dan halaman produk

### Pesanan (`/orders`)
- Riwayat semua order dengan filter status & tanggal
- Detail order modal (item list, total, kasir yang proses, catatan)
- Update status: lunas, batalkan, void (dengan konfirmasi)

### Transaksi (`/transactions`)
- Riwayat semua transaksi (tunai + Midtrans)
- Detail pembayaran: metode, snap token, waktu bayar
- Batalkan transaksi (admin)

### Laporan (`/reports`) — Admin & Developer
- **Tab Penjualan:** total revenue, jumlah transaksi, rata-rata, produk terjual
- Filter periode: hari ini, 7 hari, 30 hari, bulanan, custom date range
- Line chart tren harian + tabel top produk dengan % kontribusi revenue
- **Tab Stok:** total produk aktif, stok menipis, stok habis, nilai total stok
- Download laporan: **PDF** & **Excel** (generate di backend)

### User Management (`/users`) — Developer only
- CRUD user: tambah, edit data & password, hapus permanen
- Toggle aktif / nonaktif akun
- Filter: nama/email, role, status
- Guard: tidak bisa hapus/nonaktifkan akun sendiri; developer tidak bisa dihapus via panel

### AI Monitoring Dashboard (`/ai-monitoring`) — Admin & Developer
- **Stat hari ini:** total request, total token terpakai, jumlah user aktif
- **Alert token tinggi** (banner merah) jika total token hari ini melewati threshold
- **Stat mingguan & bulanan:** request dan token
- **Per-tipe query:** breakdown Sales Analysis vs Prediksi Stok vs Rekomendasi
- **Per-provider:** Groq vs OpenRouter dengan bar visual + warning jika fallback aktif
- **Tren 7 hari** dengan bar chart horizontal
- **Tabel per-user:** progress bar kuota harian, badge "HAMPIR HABIS" / "LIMIT TERCAPAI"
- Refresh manual

### Profil & Subscription (`/profile`)
- Edit nama, email, no. HP, password
- Lihat status subscription (Free / Pro / Enterprise)
- Upgrade plan dengan payment Midtrans

### Landing Page (`/`)
- Hero section, fitur, cara kerja, pricing, testimonial
- Navigasi ke login / register

---

## Role & Akses

| Fitur | user | kasir | admin | developer |
|---|:---:|:---:|:---:|:---:|
| Kasir (buat order) | ✅ | ✅ | ✅ | ✅ |
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

## Subscription Plan

| Plan | Harga | AI Access | Limit/hari |
|---|---|---|---|
| **Free** | Gratis | — | — |
| **Pro** | Berbayar (Midtrans) | ✅ | 10 query/hari |
| **Enterprise** | Berbayar (Midtrans) | ✅ | 10 query/hari |

Limit harian AI dikonfigurasi via environment variable `AI_DAILY_LIMIT`.

---

## Struktur Proyek

```
pos-system/
│
├── frontend/                              # Next.js 14
│   └── src/
│       ├── app/
│       │   ├── (auth)/                   # Login, Register
│       │   ├── (dashboard)/
│       │   │   ├── dashboard/            # Halaman utama + charts
│       │   │   ├── kasir/                # POS Terminal
│       │   │   ├── products/             # Manajemen produk
│       │   │   ├── categories/           # Manajemen kategori
│       │   │   ├── orders/               # Daftar & detail pesanan
│       │   │   ├── transactions/         # Riwayat transaksi
│       │   │   ├── reports/              # Laporan + download
│       │   │   ├── users/                # User management
│       │   │   ├── ai-monitoring/        # AI usage dashboard (admin)
│       │   │   ├── profile/              # Profil + subscription
│       │   │   └── upgrade/              # Halaman upgrade plan
│       │   ├── dev/subscriptions/        # Dev panel
│       │   └── api/send-whatsapp/        # Server-side Fonnte proxy
│       ├── components/
│       │   ├── ui/                       # NeoButton, NeoCard, NeoModal, dll
│       │   ├── layout/                   # Sidebar, Navbar, AISidebar
│       │   └── dashboard/                # StatCard, SalesChart, dll
│       ├── services/                     # aiService, productService, dll
│       ├── stores/                       # authStore, cartStore, aiStore
│       └── hooks/                        # useProducts, useOrders, useDebounce
│
└── backend/                               # Laravel 11
    ├── app/
    │   ├── Http/
    │   │   ├── Controllers/Api/
    │   │   │   ├── AuthController.php
    │   │   │   ├── ProductController.php
    │   │   │   ├── CategoryController.php
    │   │   │   ├── OrderController.php
    │   │   │   ├── TransactionController.php
    │   │   │   ├── ReportController.php
    │   │   │   ├── UserController.php
    │   │   │   ├── AiController.php
    │   │   │   └── SubscriptionController.php
    │   │   └── Middleware/RoleMiddleware.php
    │   ├── Models/                        # Eloquent models
    │   ├── Services/GroqService.php       # AI dual-provider logic
    │   └── Scopes/TenantScope.php         # Multi-tenant isolation
    ├── config/ai.php                      # Konfigurasi limit & threshold AI
    ├── routes/api.php                     # Semua API endpoints
    └── database/migrations/               # 17 migration files
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

Products
  GET    /api/products                    → list (filter: search, category, status, stok)
  POST   /api/products                    → tambah + upload foto [Admin]
  PUT    /api/products/{id}               → update [Admin]
  DELETE /api/products/{id}               → hapus [Admin]

Categories
  GET    /api/categories
  POST   /api/categories                  → [Admin]
  PUT    /api/categories/{id}             → [Admin]
  DELETE /api/categories/{id}             → [Admin]

Orders
  POST   /api/orders                      → buat order + kurangi stok otomatis
  GET    /api/orders                      → list semua order [Kasir+]
  GET    /api/orders/{id}                 → detail order
  PATCH  /api/orders/{id}/status          → update status [Kasir+]
  GET    /api/orders/my/history           → riwayat order milik sendiri

Transactions
  POST   /api/transactions                → buat transaksi → dapat snap_token Midtrans
  GET    /api/transactions                → list semua [Kasir+]
  GET    /api/transactions/{id}           → detail
  PATCH  /api/transactions/{id}/cancel    → batalkan [Admin]
  POST   /api/webhook/midtrans            → webhook dari server Midtrans (public)

Reports [Admin+]
  GET    /api/reports/sales               → data penjualan (filter periode)
  GET    /api/reports/stock               → kondisi stok semua produk
  GET    /api/reports/sales/download      → ?format=pdf|excel
  GET    /api/reports/stock/download      → ?format=pdf|excel

AI Assistant [Admin+]
  GET    /api/ai/usage-today              → kuota hari ini { used, remaining, limit, warning }
  POST   /api/ai/query                    → analisis penjualan bahasa natural
  POST   /api/ai/predict-stock            → prediksi kapan stok habis
  POST   /api/ai/recommend               → rekomendasi produk / bundling
  GET    /api/ai/logs                     → riwayat semua query AI [Admin]
  GET    /api/ai/stats                    → monitoring usage LLM [Admin]

Users [Developer]
  GET    /api/users                       → list semua user (filter: search, role, status)
  POST   /api/users                       → buat user baru
  GET    /api/users/{id}                  → detail
  PUT    /api/users/{id}                  → update data + password
  DELETE /api/users/{id}                  → hapus permanen
  PATCH  /api/users/{id}/toggle           → aktifkan / nonaktifkan

Subscription
  GET    /api/subscription                → status subscription user
  POST   /api/subscription/initiate       → mulai proses upgrade (buat transaksi Midtrans)
  POST   /api/webhook/midtrans-subscription → webhook konfirmasi pembayaran (public)
```

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

orders
  id, tenant_id, user_id, order_number, status (pending|paid|cancelled|void),
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

## Cara Menjalankan di Local

### Prasyarat
- PHP 8.3+, Composer
- Node.js 18+, npm
- MySQL 8

### 1. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env

# Edit .env — isi nilai berikut:
# DB_DATABASE=kasirai
# DB_USERNAME=root
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
cp .env.example .env.local    # jika tidak ada .env.example, buat manual

# Isi .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
# NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
# FONNTE_TOKEN=...              ← dari fonnte.com

npm run dev
```

Akses di `http://localhost:3000`

### Konfigurasi AI (opsional)

```env
# backend/.env
AI_DAILY_LIMIT=10              # max query AI per user per hari
AI_WARNING_THRESHOLD_PCT=30    # warning muncul saat sisa kuota ≤ 30%
AI_TOKEN_ALERT_THRESHOLD=50000 # alert admin jika total token hari ini > nilai ini

# OpenRouter (fallback — opsional)
OPENROUTER_API_KEY=sk-or-...
```

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
| Self-protection | Tidak bisa hapus / nonaktifkan akun sendiri; developer tidak bisa dihapus via panel |

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

`Next.js 14` `React 18` `Laravel 11` `PHP 8.3` `MySQL` `REST API Design`  
`Zustand` `Tailwind CSS` `Neobrutalism Design System` `Multi-tenant Architecture`  
`Laravel Sanctum` `Laravel Global Scope` `Groq AI Integration` `OpenRouter Fallback`  
`LLM Rate Limiting & Monitoring` `Midtrans Payment Gateway` `WhatsApp API (Fonnte)`  
`PDF & Excel Generation` `File Upload` `Recharts` `Role-based Access Control`

---

<div align="center">

*Dibangun dengan sepenuh hati sebagai Final Project Bootcamp — Mei–Juni 2026*

</div>
