<div align="center">

# KasirAI — Point of Sale System

### Full Stack Web Application · Next.js 14 + Laravel 11 + AI Assistant

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Aplikasi POS (Point of Sale) berbasis web untuk UMKM — terinspirasi dari Moka POS.**
Dibangun sebagai Final Project Full Stack Bootcamp dengan integrasi AI, payment gateway, dan WhatsApp API.

[Live Demo](#) · [Lihat Kode Frontend](./frontend) · [Lihat Kode Backend](./backend)

</div>

---

## Tentang Project

KasirAI adalah sistem kasir digital lengkap yang menyelesaikan masalah nyata UMKM:

| Masalah | Solusi di KasirAI |
|---|---|
| Struk harus cetak manual | Struk otomatis via WhatsApp (Fonnte API) |
| Tidak tahu produk terlaris | AI Assistant — tanya pakai bahasa Indonesia |
| Stok sering tidak terpantau | Alert stok menipis + laporan real-time |
| Satu toko satu sistem | Multi-tenant: satu app untuk banyak bisnis |
| Laporan manual di Excel | Export otomatis PDF & Excel |

---

## Tech Stack

### Frontend
| | Teknologi | Alasan Dipilih |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR, file-based routing, API routes built-in |
| UI Library | **React 18** | Component-based, ecosystem luas |
| Styling | **Tailwind CSS 3.4** | Utility-first, custom design system cepat |
| State | **Zustand 5** | Lightweight, lebih simpel dari Redux |
| HTTP | **Axios** | Interceptors untuk auto-attach auth token |
| Charts | **Recharts** | Composable chart library untuk React |
| Design | **Neobrutalism** | Custom design system — bold, unik, memorable |

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
| **Midtrans Snap** | Payment gateway: QRIS, GoPay, OVO, VA, Kartu Kredit |
| **Groq LLaMA 3.3 70B** | AI Assistant — analisis data bisnis bahasa natural |
| **Fonnte.com** | WhatsApp API — kirim struk otomatis ke customer |

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                          │
│                                                             │
│  Next.js 14 App (localhost:3000)                            │
│  ├── App Router → /kasir, /dashboard, /products, ...        │
│  ├── Zustand   → Cart & Auth global state                   │
│  ├── Axios     → API calls + auth token interceptor         │
│  └── /api/send-whatsapp → server-side proxy (token aman)    │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API (JSON)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               Laravel 11 API (localhost:8000)                │
│                                                             │
│  Middleware Stack:                                          │
│  ├── Sanctum Authentication (Bearer Token)                  │
│  ├── RoleMiddleware (admin | kasir | developer)             │
│  └── TenantScope (Global Scope — auto filter tenant_id)     │
│                                                             │
│  Controllers → Models (Eloquent) → MySQL                    │
└──────────────┬────────────────────┬────────────────────────┘
               │                    │
    ┌──────────▼──────┐    ┌────────▼──────────────┐
    │   MySQL Database │    │   External Services    │
    │                 │    │                        │
    │  Multi-tenant   │    │  ├── Midtrans (payment) │
    │  data isolation │    │  ├── Groq AI (LLaMA)   │
    │  via tenant_id  │    │  └── Fonnte (WhatsApp) │
    └─────────────────┘    └────────────────────────┘
```

### Keputusan Arsitektur yang Menarik

**1. Multi-Tenant dengan Global Scope**
Setiap bisnis (tenant) punya data yang sepenuhnya terisolasi menggunakan Laravel Global Scope. Setiap query ke database otomatis ditambahkan `WHERE tenant_id = ?` tanpa perlu ditulis manual di setiap controller.

```php
// TenantScope.php — diterapkan di semua model Product, Category, Order, dll
public function apply(Builder $builder, Model $model): void
{
    if (Auth::check() && Auth::user()->tenant_id !== null) {
        $builder->where($model->getTable() . '.tenant_id', Auth::user()->tenant_id);
    }
    // Developer (tenant_id = null) → bypass, bisa lihat semua data
}
```

**2. Server-side WhatsApp Proxy**
Token Fonnte tidak di-expose ke browser. Frontend memanggil Next.js API route `/api/send-whatsapp` yang berjalan di server, lalu server yang memanggil Fonnte API. Token hanya ada di environment variable server.

**3. Cash Payment Auto-Mark Paid**
Berbeda dengan Midtrans (yang menggunakan webhook), pembayaran tunai langsung menandai order sebagai `paid` setelah order dibuat — tanpa perlu roundtrip ke payment gateway.

---

## Fitur Lengkap

### Kasir / POS Terminal
- Split-screen layout: grid produk (60%) + keranjang (40%)
- Search produk real-time dengan debounce 400ms
- Filter produk per kategori (tab horizontal scroll)
- Keranjang dengan kontrol quantity + validasi stok
- **Bayar Tunai:** modal kembalian otomatis + quick amount buttons
- **Bayar Digital:** Midtrans Snap popup (QRIS, GoPay, OVO, dll)
- Struk digital: tampil di layar + cetak + kirim WhatsApp otomatis
- Kelola produk langsung dari kasir (panel slide-over)
- Responsive: mobile-friendly dengan drawer keranjang

### Dashboard & Analytics
- Stat cards: revenue, order, stok kritis, total produk
- Line chart tren penjualan 7 hari
- Bar chart top produk terlaris
- Pie chart distribusi metode bayar
- Tabel 10 transaksi terbaru

### AI Assistant (Groq LLaMA 3.3)
- Chat sidebar persisten — tanya dengan bahasa Indonesia
- Context otomatis: AI diberi data penjualan + stok bisnis saat ini
- Quick prompts: produk terlaris, stok mau habis, rekomendasi bundling
- Typing indicator saat AI generate jawaban

### Manajemen Produk
- CRUD lengkap + upload foto (JPG/PNG/WebP, maks 2MB)
- Auto-generate SKU dari nama produk
- Toggle aktif/nonaktif langsung dari tabel
- Filter: status, kategori, stok rendah
- Stok badge: Normal / Menipis / Habis

### Laporan
- **Tab Penjualan:** revenue, transaksi, rata-rata, produk terjual
- Filter: hari ini, 7 hari, 30 hari, bulanan, custom range
- Line chart + tabel top produk dengan % kontribusi
- **Tab Stok:** total produk, menipis, habis, nilai total stok
- Download PDF & Excel (server-side generation)

### Pesanan & Transaksi
- Riwayat semua order dengan filter status & tanggal
- Detail order modal (item, total, kasir, catatan)
- Tandai lunas manual, batalkan, void (admin + PIN konfirmasi)

### User Management
- CRUD user dengan role (admin / kasir)
- Toggle aktif/nonaktif tanpa hapus data histori
- Tidak bisa nonaktifkan diri sendiri

---

## Struktur Proyek

```
pos-system/
├── frontend/                          # Next.js 14 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/               # Login, Register
│   │   │   ├── (dashboard)/          # Dashboard, Produk, Laporan, dll
│   │   │   ├── kasir/                # POS Terminal (layout terpisah)
│   │   │   └── api/send-whatsapp/    # Server-side Fonnte proxy
│   │   ├── components/
│   │   │   ├── ui/                   # Design system (NeoButton, NeoCard, dll)
│   │   │   ├── layout/               # Sidebar, Navbar, AI Sidebar
│   │   │   └── dashboard/            # StatCard, Charts
│   │   ├── services/                 # API layer (productService, orderService, dll)
│   │   ├── stores/                   # Zustand (cartStore, authStore)
│   │   └── hooks/                    # useProducts, useOrders, useDebounce
│   └── next.config.mjs
│
└── backend/                           # Laravel 11 API
    ├── app/
    │   ├── Http/Controllers/Api/      # AuthController, ProductController, dll
    │   ├── Models/                    # Eloquent models (Product, Order, dll)
    │   ├── Scopes/TenantScope.php     # Multi-tenant isolation
    │   └── Http/Middleware/           # RoleMiddleware
    ├── routes/api.php                 # Semua API endpoints
    └── storage/app/public/products/   # Upload gambar produk
```

---

## API Endpoints Utama

```
Auth
  POST   /api/register              → daftar + buat tenant baru
  POST   /api/login                 → login → dapat Bearer token
  GET    /api/me                    → data user yang login

Products
  GET    /api/products              → list (filter: search, category, status, stok)
  POST   /api/products              → tambah + upload foto [Admin]
  PUT    /api/products/{id}         → update [Admin]
  DELETE /api/products/{id}         → hapus (cek relasi order) [Admin]

Orders & Transactions
  POST   /api/orders                → buat order + kurangi stok otomatis
  PATCH  /api/orders/{id}/status    → update status (paid/cancelled/void)
  POST   /api/transactions          → buat transaksi Midtrans → snap_token
  POST   /api/webhook/midtrans      → Midtrans webhook handler

Reports [Admin]
  GET    /api/reports/sales         → data penjualan (filter periode)
  GET    /api/reports/stock         → kondisi stok semua produk
  GET    /api/reports/sales/download?format=pdf|excel

AI Assistant [Admin]
  POST   /api/ai/query              → query natural language ke Groq LLaMA
```

---

## Cara Menjalankan

### Prasyarat
- PHP 8.3+, Composer
- Node.js 18+, npm
- MySQL 8

### Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env

# Edit .env:
# APP_URL=http://localhost:8000
# DB_DATABASE=pos_system
# MIDTRANS_SERVER_KEY=...
# GROQ_API_KEY=...

php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### Frontend (Next.js)
```bash
cd frontend
npm install
cp .env.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
# NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=...
# FONNTE_TOKEN=...

npm run dev
```

Akses di `http://localhost:3000`

---

## Database Schema

```
tenants       → id, name, slug, subscription_plan
users         → id, tenant_id, name, email, role, is_active
categories    → id, tenant_id, name, slug, is_active
products      → id, tenant_id, category_id, name, sku, price, stock, stock_alert, image, is_active
orders        → id, tenant_id, user_id, order_number, status, subtotal, tax, total, notes
order_items   → id, order_id, product_id, quantity, price (snapshot), subtotal
transactions  → id, order_id, snap_token, payment_method, status, paid_at
ai_query_logs → id, user_id, type, query, response, tokens_used
```

---

## Keamanan

- **Auth:** Laravel Sanctum — Bearer token di setiap request
- **Authorization:** Role middleware (admin / kasir) + ownership check per resource
- **Isolasi data:** TenantScope — `WHERE tenant_id = ?` otomatis di semua query
- **File upload:** Validasi MIME type + max size 2MB
- **Secret management:** Fonnte token disimpan server-side (bukan `NEXT_PUBLIC_`)
- **Payment security:** Midtrans webhook diverifikasi dengan signature key
- **SQL Injection:** Dilindungi oleh Eloquent ORM + parameter binding

---

## Developer

<table>
  <tr>
    <td align="center">
      <strong>Saifudin Reza</strong><br/>
      Full Stack Developer<br/>
      <em>Full Stack Web Development Bootcamp</em><br/><br/>
      <a href="https://github.com/saifudinreza">GitHub</a> ·
      <a href="mailto:donojomi@gmail.com">Email</a>
    </td>
  </tr>
</table>

**Skills yang digunakan dalam project ini:**
`Next.js` `React` `Laravel` `PHP` `MySQL` `REST API` `Zustand` `Tailwind CSS`
`Midtrans Integration` `WhatsApp API` `Groq AI` `Multi-tenant Architecture`
`JWT/Token Auth` `File Upload` `PDF/Excel Generation` `Recharts`

---

<div align="center">

*Dibangun dengan sepenuh hati sebagai Final Project Bootcamp — Mei 2026*

⭐ Kalau project ini bermanfaat, jangan lupa kasih star!

</div>
