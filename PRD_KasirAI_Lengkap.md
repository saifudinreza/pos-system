# PRD — KasirAI Point of Sale System
### Product Requirements Document — Full Stack Final Project

**Author:** Saifudin Reza
**Tanggal:** Mei 2026
**Status:** In Development

---

## 1. RINGKASAN PROYEK

**KasirAI** adalah aplikasi Point of Sale (POS) berbasis web yang terinspirasi dari Moka POS — dirancang untuk UMKM seperti kafe, warung, dan toko retail. Dibangun sebagai final project bootcamp full-stack dengan fitur unggulan **AI Assistant** berbasis Groq LLaMA yang membantu pemilik bisnis membaca data penjualan secara natural (cukup tanya pakai bahasa Indonesia).

### Tujuan Utama
- Memudahkan kasir memproses transaksi (tunai & digital) dengan cepat
- Memberi pemilik bisnis insight penjualan dan stok secara real-time
- Mengirim struk digital otomatis ke WhatsApp customer
- Multi-tenant: satu aplikasi bisa dipakai banyak bisnis berbeda, data tetap terisolasi

---

## 2. TECH STACK

### Frontend
| Teknologi | Versi | Kegunaan |
|---|---|---|
| **Next.js** | 14.2.35 | Framework React dengan App Router, SSR/CSR |
| **React** | 18 | UI library |
| **Tailwind CSS** | 3.4.1 | Utility-first styling |
| **Zustand** | 5.0.13 | Global state management (keranjang belanja) |
| **Axios** | 1.16.1 | HTTP client untuk API calls |
| **Recharts** | 3.8.1 | Chart library (line chart, bar chart, pie chart) |
| **Lucide React** | 1.16.0 | Icon library |

### Backend
| Teknologi | Versi | Kegunaan |
|---|---|---|
| **Laravel** | 13.8 (Framework 11) | PHP framework, REST API |
| **PHP** | ^8.3 | Runtime bahasa |
| **MySQL** | - | Database relasional |
| **Laravel Sanctum** | 4.3 | API authentication (token-based) |
| **DomPDF** | 3.1 | Generate laporan PDF |
| **Maatwebsite Excel** | 3.1 | Generate laporan Excel (.xlsx) |
| **Midtrans PHP SDK** | 2.6 | Payment gateway integration |
| **Predis** | 3.4 | Redis client (caching) |

### Third-party Services
| Service | Kegunaan |
|---|---|
| **Midtrans Snap** | Payment gateway: QRIS, GoPay, OVO, Transfer Bank |
| **Fonnte.com** | WhatsApp API — kirim struk otomatis ke customer |
| **Groq LLaMA 3.3** | AI Assistant — analisis data penjualan dengan bahasa natural |

### Design System
**Neobrutalism** — desain dengan karakteristik:
- Border hitam tebal (`2px solid #0A0A0A`)
- Shadow offset solid (`box-shadow: 4px 4px 0 #0A0A0A`)
- Warna kontras: kuning (`#FFE500`), hitam, putih
- Font: Space Grotesk (judul) + JetBrains Mono (angka)

---

## 3. ARSITEKTUR SISTEM

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER (User)                    │
│                                                     │
│   Next.js App (localhost:3000)                      │
│   ├── App Router (src/app/)                         │
│   ├── Zustand Store (keranjang, auth)               │
│   └── Axios → API calls ke backend                 │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/REST
                   ▼
┌─────────────────────────────────────────────────────┐
│              Laravel API (localhost:8000)            │
│                                                     │
│   routes/api.php → Controllers → Models             │
│   ├── Auth: Laravel Sanctum (token)                 │
│   ├── Multi-tenant: TenantScope (global scope)      │
│   ├── File upload: storage/app/public/              │
│   └── Symlink: public/storage → storage/app/public  │
└──────┬──────────────────┬───────────────────────────┘
       │                  │
       ▼                  ▼
  MySQL Database     External Services
  (tenant data)      ├── Midtrans (payment)
                     ├── Fonnte (WhatsApp)
                     └── Groq API (AI)
```

### Multi-Tenant Architecture
Setiap bisnis (tenant) punya data yang terisolasi. Isolasi dilakukan via `tenant_id` di setiap tabel dan `TenantScope` Laravel yang otomatis menambah filter `WHERE tenant_id = ?` di setiap query.

```
User Register → Tenant baru dibuat → User dapat tenant_id
User Login    → Semua query otomatis filter by tenant_id
Developer     → tenant_id = null → bisa lihat semua data
```

---

## 4. STRUKTUR DATABASE

### Tabel Utama
```
tenants          → data bisnis (nama toko, plan)
users            → kasir & admin, relasi ke tenant
categories       → kategori produk per tenant
products         → produk dengan stok, harga, gambar
orders           → header transaksi (status, total)
order_items      → detail item per order
transactions     → data payment (Midtrans snap_token)
subscriptions    → paket langganan (free/pro/enterprise)
ai_query_logs    → histori query ke Groq AI & openrouter ai
```

### Relasi Utama
```
Tenant ──< User
Tenant ──< Category ──< Product ──< OrderItem >── Order
Order ──── Transaction
Order ──── User (kasir yang transaksi)
```

---

## 5. FITUR YANG SUDAH DIIMPLEMENTASIKAN

### 5.1 Autentikasi
- Login dengan email & password
- Register akun baru → otomatis buat tenant baru
- Protected routes (redirect ke login kalau belum auth)
- Token disimpan di localStorage via Sanctum
- Role: `admin`, `kasir`, `developer`

### 5.2 Dashboard
- **Stat cards:** Total Revenue bulan ini, Total Order hari ini, Stok Kritis, Total Produk
- **Line chart:** Tren penjualan 7 hari terakhir (Recharts)
- **Bar chart:** Top produk terlaris bulan ini
- **Pie chart:** Distribusi metode pembayaran (Tunai vs Digital)
- **Tabel:** 10 transaksi terbaru dengan status badge
- Data real-time dari API backend

### 5.3 Modul Produk
- Tabel produk dengan foto, nama, SKU, kategori, harga, stok, status
- CRUD lengkap via modal (tambah, edit, hapus)
- Upload foto produk (JPG, PNG, WebP, maks 2MB)
- Auto-generate SKU dari nama produk
- Toggle aktif/nonaktif langsung dari tabel (tanpa buka modal)
- Filter: by status, by kategori, by stok rendah
- Search: by nama atau SKU (debounced 500ms)
- Pagination

**Stok Badge Logic:**
- `stock > stock_alert` → `Normal` (hijau)
- `0 < stock ≤ stock_alert` → `Menipis` (oranye)
- `stock === 0` → `Habis` (merah)

### 5.4 Modul Kategori
- CRUD kategori (nama, slug auto-generate, aktif/nonaktif)
- Kategori dipakai sebagai filter di kasir dan produk

### 5.5 Modul Kasir (POS Terminal) ← Core Feature
**Layout split-screen:**
- Kiri (~60%): Grid produk + search + filter kategori
- Kanan (~40%): Keranjang + checkout panel

**Fitur produk grid:**
- Search realtime (nama + SKU, debounced 400ms)
- Filter tab per kategori (horizontal scroll)
- Klik produk → masuk keranjang
- Produk stok 0 → disabled + badge "Stok Habis"
- Produk stok rendah → teks oranye sebagai peringatan

**Fitur keranjang:**
- Tombol +/- untuk ubah quantity (tidak bisa melebihi stok)
- Tombol hapus item
- Tombol kosongkan semua
- Input No. HP customer (untuk struk WhatsApp)
- Input catatan pesanan
- Total auto-calculate

**Checkout Tunai:**
1. Klik "TUNAI" → modal input uang diterima
2. Quick amount buttons (kelipatan Rp 5.000, 50K, 100K, dll)
3. Kembalian auto-hitung, warna merah kalau kurang
4. Klik "Proses Bayar" → buat order → langsung update status `paid`
5. Tampil struk sukses

**Checkout Digital (Midtrans):**
1. Klik "DIGITAL" → buat order + buat transaksi ke Midtrans
2. Midtrans Snap popup → user pilih metode (QRIS, GoPay, OVO, dll)
3. Setelah bayar → Midtrans webhook ke backend → update status
4. Tampil struk sukses

**Kelola Produk dari Kasir:**
- Tombol "Produk" → panel slide-over dari kanan
- CRUD produk tanpa keluar halaman kasir
- Setelah simpan → grid produk auto-refresh

**Responsive:**
- Desktop: layout dua kolom
- Mobile: keranjang tersembunyi, buka via tombol "Keranjang"

### 5.6 Struk Digital
**3 format struk:**

1. **Tampilan modal (layar)** — setelah bayar sukses, muncul popup struk digital
2. **Print struk** — buka tab baru, cetak via `window.print()`, format thermal printer (lebar 280px, font monospace)
3. **WhatsApp via Fonnte** — struk terformat rapi dengan emoji dikirim langsung ke nomor HP customer tanpa buka WhatsApp manual

**Format struk WA:**
```
☕ *KASIR AI*
_Struk Pembayaran Digital_
━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *Detail Pesanan*
🔢 No. Order  : *ORD-20260528-0001*
👤 Kasir       : nabila
📅 Tanggal    : 28 Mei 2026, 22.43

━━━━━━━━━━━━━━━━━━━━━━━━━
🛍️ *Item Pesanan*
━━━━━━━━━━━━━━━━━━━━━━━━━
▸ *Espresso*
   1 pcs × Rp 20.000 = *Rp 20.000*
━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Subtotal       : Rp 20.000
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *TOTAL           : Rp 20.000*
━━━━━━━━━━━━━━━━━━━━━━━━━

💳 Bayar (Tunai) : Rp 50.000
🔄 Kembalian      : *Rp 30.000*

━━━━━━━━━━━━━━━━━━━━━━━━━
🙏 *Terima kasih sudah berbelanja!*
Sampai jumpa lagi & selamat menikmati! 👋✨
```

### 5.7 Modul Pesanan
- Tabel semua order dengan status, total, tanggal
- Filter: by status (pending/paid/cancelled), by rentang tanggal
- Klik order → modal detail (item, total, kasir, catatan)
- **Tandai Lunas** — untuk order pending yang dibayar manual/tunai lama
- **Batalkan** — cancel order pending
- **Void** — batalkan order yang sudah paid (admin only, butuh PIN)

### 5.8 Modul Laporan (Admin Only)

**Tab Penjualan:**
- Summary: Revenue, Total Transaksi, Rata-rata, Produk Terjual
- Filter preset: Hari Ini, 7 Hari, 30 Hari, Bulanan, Custom Date Range
- Line chart tren penjualan
- Bar chart top produk
- Tabel data mentah per periode
- Download PDF & Excel

**Tab Stok:**
- Summary: Total Produk Aktif, Stok Menipis, Stok Habis, Nilai Total Stok
- Tabel semua produk dengan status stok
- Diurutkan dari stok paling sedikit
- Download PDF & Excel

### 5.9 Modul User Management (Admin Only)
- Tabel semua user tenant (nama, email, role, status)
- Tambah user baru dengan set role (admin/kasir)
- Edit data user
- Toggle aktif/nonaktif
- Tidak bisa hapus atau nonaktifkan diri sendiri

### 5.10 AI Assistant Sidebar
- Sidebar persisten di kanan halaman dashboard
- Powered by **Groq LLaMA 3.3 70B**
- Chat interface dengan bubble chat
- Typing indicator saat AI sedang generate
- Context: AI diberi data penjualan + stok + user tenant secara otomatis

**Quick prompts:**
- "Produk terlaris bulan ini?"
- "Stok apa yang mau habis?"
- "Rekomendasikan produk untuk dijual bareng?"
- "Total penjualan hari ini?"

**Kemampuan AI:**
- Analisis top produk & revenue
- Prediksi kebutuhan restok
- Rekomendasi bundling produk
- Summary penjualan per periode

### 5.11 Sistem Langganan (Subscription)
Tiga tier paket dengan batasan produk:
| Paket | Batas Produk | Harga |
|---|---|---|
| Free | 5 produk | Gratis |
| Pro | 30 produk | - |
| Enterprise | Unlimited | - |

Integrasi pembayaran upgrade via Midtrans.

---

## 6. WORKFLOW LENGKAP

### 6.1 Workflow Kasir Sehari-hari
```
1. Kasir login dengan email & password
   └── Token disimpan, redirect ke /kasir

2. Buka halaman /kasir
   ├── Load produk aktif (is_active = true)
   └── Load kategori untuk filter tab

3. Proses transaksi:
   a. Klik produk → masuk keranjang
   b. Atur quantity (+/-)
   c. (Opsional) isi No. HP customer & catatan
   d. Klik TUNAI atau DIGITAL

4. Jika TUNAI:
   ├── Input uang diterima
   ├── Sistem hitung kembalian
   ├── Klik "Proses Bayar"
   ├── Backend: buat order (status=paid) + kurangi stok
   └── Tampil struk → Print / WhatsApp / Tutup

5. Jika DIGITAL:
   ├── Backend: buat order (status=pending) + buat transaksi Midtrans
   ├── Midtrans Snap popup → customer pilih metode bayar
   ├── Customer bayar → Midtrans webhook ke backend
   ├── Backend: update order.status=paid
   └── Tampil struk → Print / WhatsApp / Tutup

6. Setelah transaksi selesai:
   └── Keranjang dikosongkan, siap transaksi berikutnya
```

### 6.2 Workflow Admin/Owner
```
1. Login → redirect ke /dashboard
2. Lihat ringkasan hari ini (revenue, order, stok kritis)
3. Kelola produk (/products):
   ├── Tambah produk baru + upload foto
   ├── Edit harga/stok
   ├── Nonaktifkan produk musiman
   └── Monitor stok dengan filter "Stok Rendah"
4. Kelola kategori (/categories)
5. Monitor pesanan (/orders):
   ├── Lihat semua transaksi
   ├── Filter by status/tanggal
   └── Void order jika ada kesalahan
6. Analisis bisnis (/reports):
   ├── Laporan penjualan + download PDF/Excel
   └── Laporan kondisi stok
7. Kelola tim (/users):
   ├── Tambah akun kasir baru
   └── Nonaktifkan kasir yang keluar
```

### 6.3 Workflow Multi-Tenant (Registrasi Bisnis Baru)
```
1. Pemilik bisnis daftar di /register
2. Backend: buat Tenant baru → buat User dengan tenant_id tersebut
3. Login → semua data (produk, order, dll) terisolasi per tenant_id
4. Tambah kasir: admin buat akun baru → kasir dapat akun dengan tenant yang sama
5. Kasir & admin satu toko berbagi produk & laporan yang sama
```

---

## 7. STRUKTUR FOLDER PROYEK

```
pos-system/
├── frontend/                   # Next.js App
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── (auth)/         # Login, Register
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/    # Halaman utama (butuh auth)
│   │   │   │   ├── layout.jsx  # Sidebar + Navbar
│   │   │   │   ├── dashboard/
│   │   │   │   ├── products/
│   │   │   │   ├── categories/
│   │   │   │   ├── orders/
│   │   │   │   ├── transactions/
│   │   │   │   ├── reports/
│   │   │   │   ├── users/
│   │   │   │   └── profile/
│   │   │   ├── kasir/          # POS Terminal (layout terpisah)
│   │   │   │   ├── layout.jsx
│   │   │   │   └── page.jsx    # Main kasir page
│   │   │   └── api/
│   │   │       └── send-whatsapp/ # Next.js API route (proxy Fonnte)
│   │   ├── components/
│   │   │   ├── ui/             # Design system
│   │   │   │   ├── NeoButton.jsx
│   │   │   │   ├── NeoCard.jsx
│   │   │   │   ├── NeoInput.jsx
│   │   │   │   ├── NeoModal.jsx
│   │   │   │   ├── NeoBadge.jsx
│   │   │   │   ├── NeoSelect.jsx
│   │   │   │   └── NeoTable.jsx
│   │   │   ├── layout/         # Sidebar, Navbar, AI Sidebar
│   │   │   ├── dashboard/      # StatCard, Charts
│   │   │   ├── ai/             # AI chat components
│   │   │   └── landing/        # Landing page sections
│   │   ├── services/           # API calls (axios)
│   │   │   ├── productService.js
│   │   │   ├── categoryService.js
│   │   │   ├── orderService.js
│   │   │   ├── transactionService.js
│   │   │   └── reportService.js
│   │   ├── stores/             # Zustand global state
│   │   │   ├── cartStore.js    # Keranjang belanja
│   │   │   └── authStore.js    # User & token auth
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useProducts.js
│   │   │   ├── useOrders.js
│   │   │   └── useDebounce.js
│   │   └── lib/
│   │       ├── axios.js        # Axios instance + interceptors
│   │       └── utils.js        # formatCurrency, formatDate, dll
│   ├── .env.local              # Environment variables
│   └── next.config.mjs
│
└── backend/                    # Laravel API
    ├── app/
    │   ├── Http/Controllers/Api/
    │   │   ├── AuthController.php
    │   │   ├── ProductController.php
    │   │   ├── CategoryController.php
    │   │   ├── OrderController.php
    │   │   ├── TransactionController.php
    │   │   ├── ReportController.php
    │   │   └── UserController.php
    │   ├── Models/
    │   │   ├── Tenant.php
    │   │   ├── User.php
    │   │   ├── Product.php
    │   │   ├── Category.php
    │   │   ├── Order.php
    │   │   ├── OrderItem.php
    │   │   └── Transaction.php
    │   ├── Scopes/
    │   │   └── TenantScope.php  # Auto-filter by tenant_id
    │   └── Http/Middleware/
    │       └── RoleMiddleware.php
    ├── routes/
    │   └── api.php             # Semua API endpoints
    ├── storage/app/public/
    │   └── products/           # File gambar produk
    └── .env                    # APP_URL, DB, Midtrans key, dll
```

---

## 8. API ENDPOINTS

### Auth
```
POST   /api/register          → daftar akun baru + buat tenant
POST   /api/login             → login → dapat token
POST   /api/logout            → hapus token
GET    /api/me                → data user yang sedang login
```

### Products
```
GET    /api/products          → daftar produk (filter: search, category, status, stok)
GET    /api/products/{id}     → detail produk
POST   /api/products          → tambah produk (admin, multipart/form-data)
PUT    /api/products/{id}     → update produk (admin)
DELETE /api/products/{id}     → hapus produk (admin, cek relasi order)
```

### Categories
```
GET    /api/categories        → daftar kategori
POST   /api/categories        → tambah kategori (admin)
PUT    /api/categories/{id}   → update kategori (admin)
DELETE /api/categories/{id}   → hapus kategori (admin)
```

### Orders
```
POST   /api/orders            → buat order + kurangi stok otomatis
GET    /api/orders            → semua order (admin/kasir)
GET    /api/orders/{id}       → detail order + items
GET    /api/orders/my/history → order milik user yang login
PATCH  /api/orders/{id}/status → update status (paid/cancelled/void)
```

### Transactions
```
POST   /api/transactions      → buat transaksi Midtrans → dapat snap_token
POST   /api/transactions/webhook → Midtrans webhook (update status otomatis)
```

### Reports
```
GET    /api/reports/sales     → data penjualan (filter periode)
GET    /api/reports/stock     → kondisi stok semua produk
GET    /api/reports/sales/download     → download PDF/Excel penjualan
GET    /api/reports/stock/download     → download PDF/Excel stok
```

### Users & AI
```
GET    /api/users             → daftar user (admin)
POST   /api/users             → tambah user baru (admin)
PUT    /api/users/{id}        → update user (admin)
POST   /api/ai/query          → query ke Groq AI dengan context data bisnis
```

---

## 9. ENVIRONMENT VARIABLES

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-xxxx
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
FONNTE_TOKEN=xxxx          # Token Fonnte WhatsApp API (server-side, tidak NEXT_PUBLIC)
```

### Backend (.env)
```env
APP_URL=http://localhost:8000   # WAJIB pakai port, untuk generate image URL
DB_CONNECTION=mysql
DB_DATABASE=pos_system

MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
MIDTRANS_IS_PRODUCTION=false

GROQ_API_KEY=gsk_xxxx
```

---

## 10. KEAMANAN

| Aspek | Implementasi |
|---|---|
| **Authentication** | Laravel Sanctum — Bearer token di setiap request |
| **Authorization** | Role middleware (`admin`, `kasir`) + ownership check |
| **Multi-tenant isolation** | TenantScope global — query otomatis filter by tenant_id |
| **File upload** | Validasi MIME type (jpg/png/webp) + max 2MB |
| **API token (Fonnte)** | Disimpan sebagai server-side env (bukan NEXT_PUBLIC) |
| **CORS** | Dikonfigurasi di Laravel, hanya allow origin frontend |
| **SQL Injection** | Eloquent ORM + parameter binding |

---

## 11. INTEGRASI THIRD-PARTY

### Midtrans (Payment Gateway)
- Sandbox mode untuk development
- Flow: Frontend → Backend buat transaksi → dapat `snap_token` → Frontend buka Midtrans Snap popup → Customer bayar → Midtrans webhook ke backend → Backend update status
- Support: QRIS, GoPay, OVO, ShopeePay, Transfer Bank, Kartu Kredit

### Fonnte (WhatsApp API)
- Flow: Frontend klik "WhatsApp" → Next.js API route `/api/send-whatsapp` → Fonnte API → WhatsApp customer
- Token disimpan di server (tidak bocor ke browser)
- Auto-format struk dengan emoji dan WhatsApp markdown (*bold*, _italic_)

### Groq LLaMA 3.3 (AI Assistant)
- Model: LLaMA 3.3 70B Versatile
- Context: data penjualan, stok, info bisnis disertakan di setiap prompt
- Backend proxy: frontend → `/api/ai/query` → Groq API → response ke frontend

---

## 12. FITUR YANG DIRENCANAKAN (Belum Diimplementasikan)

| Fitur | Alasan Belum |
|---|---|
| Diskon per item | Kompleksitas validasi role kasir vs admin |
| Sistem shift kasir | Butuh tabel shifts + UI buka/tutup shift |
| Loyalty points | Butuh modul terpisah |
| Varian produk (size/topping) | Perlu redesign schema produk |
| Multi-cabang | Arsitektur berbeda (sub-tenant) |
| Barcode scanner | Butuh hardware integration |
| Offline mode | Service Worker + IndexedDB |
| Delivery integration | GoFood/GrabFood API |

---

## 13. CARA MENJALANKAN PROYEK

### Prasyarat
- PHP 8.3+, Composer
- Node.js 18+, npm
- MySQL
- (Opsional) Redis

### Setup Backend
```bash
cd backend
composer install
cp .env.example .env
# Edit .env: DB, APP_URL=http://localhost:8000, Midtrans key
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local: API_URL, Midtrans client key, Fonnte token
npm run dev
```

### Akses
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- Kasir: `http://localhost:3000/kasir`
- Dashboard: `http://localhost:3000/dashboard`

---

*KasirAI — Full Stack POS System | Final Project Bootcamp | Saifudin Reza | 2026*
