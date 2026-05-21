# 🛒 POS System — Backend API

> Sistem Point of Sale (POS) berbasis REST API yang dibangun dengan Laravel 11.
> Dilengkapi dengan autentikasi, manajemen produk, transaksi pembayaran via Midtrans,
> laporan penjualan, dan fitur AI Assistant menggunakan Groq API.

---

## 👤 Tentang Project

|             |                                                   |
| ----------- | ------------------------------------------------- |
| **Nama**    | Saifudin Reza                                     |
| **Program** | Full Stack Web Development Bootcamp               |
| **Tema**    | Sistem Transaksi Penjualan (Point of Sale)        |
| **Stack**   | Laravel 11 · MySQL · Sanctum · Midtrans · Groq AI |

---

## 🚀 Fitur Utama

### 🔐 Authentication & Authorization

- Register, Login, Logout menggunakan Laravel Sanctum
- Role-based access control: **Admin**, **Kasir**, **User**
- Middleware proteksi endpoint berdasarkan role

### 📦 Manajemen Produk

- CRUD produk dengan upload gambar
- Filter berdasarkan kategori, status, stok menipis
- Search by nama atau SKU
- Pagination & sorting

### 🗂️ Manajemen Kategori

- CRUD kategori
- Auto-generate slug dari nama kategori
- Cek relasi sebelum hapus kategori

### 🛍️ Order & Transaksi

- Buat order dari cart dengan validasi stok realtime
- Auto-generate nomor order unik (`ORD-20260521-0001`)
- Snapshot harga produk saat transaksi
- DB Transaction untuk mencegah race condition stok
- Rollback stok otomatis saat order dibatalkan

### 💳 Payment Gateway — Midtrans

- Integrasi Midtrans Snap untuk pembayaran
- Support QRIS, Virtual Account, GoPay, OVO, Kartu Kredit
- Webhook handler untuk update status pembayaran otomatis
- Rollback stok otomatis jika pembayaran expire/cancel

### 📊 Laporan & Analisis

- Laporan penjualan harian & bulanan
- Laporan stok dengan alert produk menipis
- Download laporan dalam format **PDF** dan **Excel**
- Data produk terlaris & total revenue

### 🤖 AI Assistant — Groq API (LLaMA 3.3)

- **Analisis Penjualan**: tanya dalam bahasa natural, AI jawab dari data DB
- **Prediksi Stok**: AI prediksi kapan stok habis berdasarkan histori penjualan
- **Rekomendasi Produk**: AI suggest produk cross-selling berdasarkan pola transaksi
- Log semua query AI untuk monitoring penggunaan token

### 👥 Manajemen User

- CRUD user oleh admin
- Toggle aktif/nonaktif user tanpa hapus data
- Filter by role dan status

---

## 🗂️ Struktur Database

```
users
├── id, name, email, password
├── role (admin | kasir | user)
├── phone, is_active

categories
├── id, name, slug, is_active

products
├── id, category_id (FK)
├── name, sku, description
├── price, stock, stock_alert
├── image, is_active

orders
├── id, user_id (FK)
├── order_number, status
├── subtotal, tax, total, notes

order_items
├── id, order_id (FK), product_id (FK)
├── quantity, price (snapshot), subtotal

transactions
├── id, order_id (FK)
├── midtrans_order_id, midtrans_transaction_id
├── payment_method, status, amount
├── snap_token, paid_at, midtrans_response

ai_query_logs
├── id, user_id (FK)
├── type, query, response, tokens_used
```

---

## 📡 API Endpoints

### Public (tidak perlu token)

| Method | Endpoint        | Keterangan           |
| ------ | --------------- | -------------------- |
| POST   | `/api/register` | Registrasi user baru |
| POST   | `/api/login`    | Login & dapat token  |

### Auth (perlu token)

| Method | Endpoint      | Keterangan           |
| ------ | ------------- | -------------------- |
| POST   | `/api/logout` | Logout               |
| GET    | `/api/me`     | Data user yang login |

### Products

| Method | Endpoint             | Role  | Keterangan                    |
| ------ | -------------------- | ----- | ----------------------------- |
| GET    | `/api/products`      | Semua | List produk + filter + search |
| GET    | `/api/products/{id}` | Semua | Detail produk                 |
| POST   | `/api/products`      | Admin | Tambah produk                 |
| PUT    | `/api/products/{id}` | Admin | Update produk                 |
| DELETE | `/api/products/{id}` | Admin | Hapus produk                  |

### Orders

| Method | Endpoint                  | Role         | Keterangan            |
| ------ | ------------------------- | ------------ | --------------------- |
| POST   | `/api/orders`             | Semua        | Buat order baru       |
| GET    | `/api/orders`             | Admin, Kasir | Semua order           |
| GET    | `/api/orders/{id}`        | Semua        | Detail order          |
| GET    | `/api/orders/my/history`  | User         | Riwayat order sendiri |
| PATCH  | `/api/orders/{id}/status` | Admin, Kasir | Update status order   |

### Transactions

| Method | Endpoint                       | Role         | Keterangan                  |
| ------ | ------------------------------ | ------------ | --------------------------- |
| POST   | `/api/transactions`            | Semua        | Buat transaksi + Snap Token |
| GET    | `/api/transactions`            | Admin, Kasir | Semua transaksi             |
| GET    | `/api/transactions/{id}`       | Semua        | Detail transaksi            |
| GET    | `/api/transactions/my/history` | User         | Riwayat transaksi sendiri   |
| POST   | `/api/webhook/midtrans`        | Public       | Webhook dari Midtrans       |

### Reports (Admin only)

| Method | Endpoint                                   | Keterangan        |
| ------ | ------------------------------------------ | ----------------- |
| GET    | `/api/reports/sales`                       | Laporan penjualan |
| GET    | `/api/reports/stock`                       | Laporan stok      |
| GET    | `/api/reports/sales/download?format=pdf`   | Download PDF      |
| GET    | `/api/reports/sales/download?format=excel` | Download Excel    |
| GET    | `/api/reports/stock/download?format=pdf`   | Download stok PDF |

### AI Assistant (Admin only)

| Method | Endpoint                | Keterangan                          |
| ------ | ----------------------- | ----------------------------------- |
| POST   | `/api/ai/query`         | Analisis penjualan natural language |
| POST   | `/api/ai/predict-stock` | Prediksi stok habis                 |
| POST   | `/api/ai/recommend`     | Rekomendasi produk cross-selling    |
| GET    | `/api/ai/logs`          | Riwayat query AI                    |

---

## ⚙️ Cara Menjalankan Project

### Kebutuhan

- PHP >= 8.2
- Composer
- MySQL
- Docker (opsional)

### Langkah Instalasi

**1. Clone repository**

```bash
git clone https://github.com/username/pos-backend.git
cd pos-backend
```

**2. Install dependencies**

```bash
composer install
```

**3. Setup environment**

```bash
cp .env.example .env
php artisan key:generate
```

**4. Isi konfigurasi di `.env`**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pos_db
DB_USERNAME=root
DB_PASSWORD=

MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

**5. Jalankan migration & seeder**

```bash
php artisan migrate:fresh --seed
```

Seeder akan membuat data awal:
| Email | Password | Role |
|-------|----------|------|
| admin@pos.com | password123 | Admin |
| kasir@pos.com | password123 | Kasir |
| customer@pos.com | password123 | User |

**6. Storage link untuk gambar**

```bash
php artisan storage:link
```

**7. Jalankan server**

```bash
php artisan serve
```

API siap diakses di `http://127.0.0.1:8000/api`

---

## 🐳 Menjalankan dengan Docker

```bash
# Build dan jalankan semua container
docker-compose up -d

# Jalankan migration di dalam container
docker-compose exec app php artisan migrate:fresh --seed
```

---

## 🧪 Testing API dengan Postman

1. Import collection Postman dari folder `/postman` (kalau ada)
2. Buat environment dengan variable:
   - `base_url` → `http://127.0.0.1:8000/api`
   - `token` → diisi otomatis setelah login
3. Hit endpoint **Login** → token tersimpan otomatis
4. Semua endpoint lain langsung bisa ditest

### Contoh Request Login

```json
POST /api/login
{
    "email": "admin@pos.com",
    "password": "password123"
}
```

### Contoh Request Buat Order

```json
POST /api/orders
Authorization: Bearer {token}

{
    "items": [
        { "product_id": 1, "quantity": 2 },
        { "product_id": 4, "quantity": 1 }
    ],
    "notes": "Tolong dibungkus"
}
```

### Contoh Request AI Query

```json
POST /api/ai/query
Authorization: Bearer {token}

{
    "query": "produk apa yang paling laku bulan ini?"
}
```

---

## 🏗️ Tech Stack

| Teknologi            | Versi | Kegunaan               |
| -------------------- | ----- | ---------------------- |
| Laravel              | 11    | Backend framework      |
| MySQL                | 8.0   | Database               |
| Laravel Sanctum      | -     | API Authentication     |
| Midtrans             | -     | Payment gateway        |
| Groq API (LLaMA 3.3) | -     | AI Assistant           |
| DomPDF               | -     | Generate laporan PDF   |
| Maatwebsite Excel    | -     | Generate laporan Excel |
| Docker               | -     | Containerization       |

---

## 📁 Struktur Folder

```
pos-backend/
├── app/
│   ├── Exports/                    # Export class untuk Excel
│   │   ├── SalesReportExport.php
│   │   └── StockReportExport.php
│   ├── Http/
│   │   ├── Controllers/Api/        # Semua API controller
│   │   │   ├── AuthController.php
│   │   │   ├── ProductController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── OrderController.php
│   │   │   ├── TransactionController.php
│   │   │   ├── ReportController.php
│   │   │   ├── UserController.php
│   │   │   └── AiController.php
│   │   └── Middleware/
│   │       └── RoleMiddleware.php  # Proteksi role
│   ├── Models/                     # Eloquent models
│   └── Services/
│       └── GroqService.php         # AI service
├── database/
│   ├── migrations/                 # Struktur tabel
│   └── seeders/                    # Data awal
├── resources/views/reports/        # Template PDF
├── routes/
│   └── api.php                     # Semua API routes
├── docker-compose.yml
└── Dockerfile
```

---

## 📐 ERD

![ERD](docs/ERD.png)

## 🔒 Keamanan

- Token-based authentication dengan Laravel Sanctum
- Role middleware untuk proteksi endpoint
- Input validation di semua endpoint
- Webhook Midtrans diverifikasi dengan signature key
- Password di-hash otomatis
- CORS policy dikonfigurasi untuk domain frontend

---

## 👨‍💻 Developer

**Saifudin Reza**
Full Stack Web Development Bootcamp
