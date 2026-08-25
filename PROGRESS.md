# PROGRESS, KasirAI (Catatan Kemajuan & TODO)

> File ini dicatat oleh agen AI / developer di akhir sesi kerja.
> **Baca dulu sebelum melanjutkan pekerjaan** supaya tahu apa yang sudah
> beres dan apa yang harus dikerjakan berikutnya.

## Status Terakhir

- Tanggal: 19 Agustus 2026
- Database: **100% TERMIGRASI & TERISI (SEEDED) KE TIDB CLOUD!** (Cluster: `kasirai-db`, Host: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`, SSL Active).
- Git: Terakhir commit `docs & config: update database ssl settings and tidb migration progress`.
- Backend Deployment: **Render.com** (bukan Railway/Fly), blueprint `render.yaml` + `backend/.dockerignore` + fix entrypoint env sudah siap di repo. Tinggal push & buat service di dashboard Render (langkah detail di bawah).
- Frontend: Berjalan di Vercel (`sikasirai.com`), tinggal update `NEXT_PUBLIC_API_URL` begitu Render aktif.

---

## Fitur yang SUDAH dikerjakan

### 12. Review & komentari seluruh codebase (readability pass)
- **Semua file backend & frontend di-review dan diberi komentar Bahasa Indonesia**:
  docblock di tiap class/method/relasi model, komentar inline di logika non-trivial,
  banner seksi di file besar (routes/api.php, kasir/page.jsx, HeroSection, dst).
- **Perbaikan efisiensi aman**: eager-load N+1 di `ShiftController::index()`
  (`withCount`/`withSum`) & `OrderController::updateStatus()`; buang import/query
  mati (`AiController::stats()` variabel duplikat, `ReportController` import DB
  & `$year` duplikat); extract helper duplikat di frontend (`persistSession` di
  authService, `buildProductFormData` di productService); buang dead code di
  halaman (import/variabel/console.log mati).
- **Bug fix nyata #1, unduhan PDF/Excel korup**: interceptor sukses `lib/axios.js`
  men-`JSON.stringify` SEMUA respons objek, termasuk Blob → file export jadi `"{}"`.
  Fix: guard `response.config?.responseType === "blob"` → respons biner dilewati.
- **Bug fix nyata #2, chart bulanan MySQL-only**: `ReportController::sales()`
  (`period=monthly`) memakai `MONTH(paid_at)` (MySQL-only, melanggar CLAUDE.md
  point 9 & bakal error kalau ada test sqlite). Fix: ambil `paid_at, amount`,
  kelompokkan per bulan di PHP via Carbon (`groupBy` + `sortKeys`), output identik.
-  **Temuan potensial yang TIDAK diubah (perlu validasi bisnis)**:
  1. `TransactionController::payCash()` mengambil transaksi status APA PUN untuk
     order, pending QRIS bisa ke-mark settlement cash & reuse midtrans_order_id.
  2. `ShiftController::open()` hardcode `shift_number => 1` (tidak pernah increment).
  3. `InsightController::index()` developer tenant null → selalu kosong.
  4. `ProductController::Cache::forget('products_all')` no-op (index tak pernah cache).
  5. Frontend `aiStore` fallback kuota `Math.max(0, remaining - 1)`, `remaining = null`
     (unlimited) jadi 0 di UI.
  6. `ReportController::sales()` `MONTH()` sudah di-fix (lihat di atas), sisanya
     hanya temuan; kalau mau dikerjakan, bahas dulu karena menyentuh alur uang.
- Test baru: `SalesReportChartTest` (2 test). Total 69 test.

---

## Fitur yang SUDAH dikerjakan

### 11. Lupa Password (reset via email)
- **Alur**: login page → "Lupa password?" → `/forgot-password` → isi email →
  `POST /api/forgot-password` → email berisi link
  `{FRONTEND_URL}/auth/reset-password?token=...&email=...` (berlaku 60 menit,
  sekali pakai) → `POST /api/reset-password` → password diganti & semua token
  Sanctum dicabut (harus login ulang).
- **Backend**:
  - `AuthController::forgotPassword()`, pakai `Password::broker()->createToken()`
    (tabel `password_reset_tokens` sudah ada dari migration bawaan Laravel!),
    balasan pesan SAMA untuk email terdaftar/tidak (anti user-enumeration).
  - `AuthController::resetPassword()`, `Password::broker()->reset()` (cek hash
    token + kadaluarsa 60 menit + hapus token setelah dipakai), `Password::min(8)`,
    cabut semua token Sanctum user.
  -  **Gotcha nama bentrok**: `Illuminate\Support\Facades\Password` vs
    `Illuminate\Validation\Rules\Password` sama-sama dipakai, facade di-alias
    `PasswordBroker` (kalau lupa, PHP fatal error).
  - `app/Mail/ResetPasswordMail.php` + blade `resources/views/emails/reset-password.blade.php`
    (desain neobrutal inline, bahasa Indonesia).
  - Routes `POST /api/forgot-password` & `POST /api/reset-password`, keduanya
    `throttle:5,1` (anti brute-force, sama seperti login/register).
  - `config/services.php` → `frontend_url` dari env `FRONTEND_URL`
    (`.env.example` sudah ada default `https://your-frontend.vercel.app`).
  - `.env.example`: blok Mail diganti SMTP Gmail (`MAIL_MAILER=smtp`,
    `MAIL_SCHEME=tls`, Laravel 11 pakai `MAIL_SCHEME`, BUKAN `MAIL_ENCRYPTION`,
    `smtp.gmail.com:587`, App Password 16 karakter).
- **Frontend**:
  - `/forgot-password` (state idle → sending → sent; ajakan cek spam) &
    `/reset-password` (baca `?token` & `?email`, validasi konfirmasi + min 8,
    state sukses → link ke login; tampilan "link tidak valid" kalau token
    kosong).
  - Login page: link "Lupa password?" di bawah input password.
  - `authService.js`: `forgotPassword()` & `resetPassword()`.
  - `middleware.js` PUBLIC_ROUTES: + `"/forgot-password"`, `"/reset-password"`.
- Test: `PasswordResetTest` (7 test).
-  **Belum aktif di production**: butuh isi `MAIL_*` + `FRONTEND_URL` di .env
  Railway (backend), lihat langkah detail di bawah.

---

### 10. Pindah tenant user (fix akun nabila)
- **Insiden**: produk & kategori akun `nabila@gmail.com` "hilang" di production.
  Penyebab: endpoint sementara `/setup-nabila` (commit `4c88982`/`ce14000`) memakai
  `firstOrCreate(['slug'=>'nabila'])` + `updateOrCreate` yang memaksa `tenant_id` user
  pindah ke tenant baru "Nabila Store" yang kosong (tenant 20), padahal data 20 produk
  & 6 kategori ada di tenant 2 "maung store". Data tidak pernah hilang, user salah tenant.
- **Fix kode**: `UserController::update()` kini menerima `tenant_id` (validasi
  `exists:tenants,id`, hanya developer yang boleh, selain developer → 403), plus audit
  log `tenant_moved`. Endpoint `/setup-nabila` **dihapus** dari `routes/api.php`.
- **Eksekusi production** (via API developer): user nabila (id 2) dipindah ke tenant 2,
  tenant 20 "Nabila Store" dihapus. Terverifikasi: 20 produk + 6 kategori tampil, plan pro.
- Test: `UserTenantMoveTest` (3 test).

### 1. Inventory Movement Ledger
- Tabel `inventory_movements` + `InventoryService::record()`.
- Tercatat otomatis saat: order dibuat (`sale`), order dibatalkan (`cancel`),
  restock (`restock`), transaksi Midtrans (sale/cancel).
- Snapshot `before_stock`/`after_stock` per pergerakan.
- Endpoint `GET /api/products/{id}/movements` (riwayat per produk).
- Test: `InventoryLedgerTest`.

### 2. Audit Log (traceability aksi admin)
- Tabel `audit_logs` + `AuditLogService::log()`.
- Dicatat untuk: create/update/delete produk, restock, role change,
  aktif/nonaktif user, update tenant, ganti plan.
- Test: bagian dari `InventoryLedgerTest`.

### 3. Customer (CRM ringan)
- Tabel `customers` + auto-capture: kasir isi No. HP di POS → pelanggan
  dibuat/dicari otomatis (`Customer::findOrCreateByPhone`, nomor dinormalisasi
  ke format 62) → `orders.customer_id` tertaut.
- Backfill nomor HP lama dari order → tabel customers.
- Endpoint admin: `GET /api/customers` (daftar + agregat orders/total belanja,
  search nama/HP), `GET /api/customers/{id}` (detail + 20 order terbaru).
- Frontend: halaman `/customers` + menu sidebar "Pelanggan".
- Test: `CustomerListTest` (5 test).

### 4. AI Business Insight + Forecast Penjualan
- `ForecastService`, prediksi 7 hari (deterministik, gratis, tanpa LLM):
  rata-rata per hari-of-week dari 35 hari terakhir. Endpoint `GET /api/reports/forecast`.
- `InsightService` + `InsightController`, AI menulis insight (penjualan/stok/
  pelanggan) dari data 3 periode; fallback templated kalau LLM error/offline.
  Endpoint `GET /api/insights` & `POST /api/insights/generate` (throttle 5/menit).
- Tabel `ai_insights`.
- Frontend: dashboard → section "Wawasan KasirAI" + kartu "Forecast 7 Hari".
- Test: `ForecastInsightTest` (5 test).

### 5. Product Cost & Profit
- Kolom `products.cost` (harga modal) + `order_items.cost` (snapshot saat
  transaksi → COGS akurat historis).
- **Bug fix**: `cost` tidak ada di `$fillable` Product → sebelumnya divalidasi
  tapi tidak tersimpan (mass assignment membuangnya).
- Laporan penjualan: summary baru `total_cogs`, `gross_profit`, `profit_margin`;
  `top_products` menyertakan `total_cogs` & `profit`.
- Frontend: kolom "Modal" + badge margin % di halaman produk; kartu
  COGS / Laba Kotor / Margin di halaman laporan.
- **Export PDF & Excel kini memuat COGS/profit**: `ReportController::downloadSales()`
  eager-load `order.items`, hitung `cogs`/`profit`/`margin` per transaksi, kirim
  `summary` (total_revenue/cogs/gross_profit/margin) ke blade `reports.sales`
  (kolom baru + baris ringkasan) dan `SalesReportExport` (kolom COGS/Laba/Margin
  + blok RINGKASAN di bawah data). Test: `ProfitReportTest` kini 6 test.

### 6. Harga yearly diperbaiki
- `SubscriptionController::PRICES`: yearly Pro & Enterprise dulunya **lebih
  murah dari bulanan** (`100000 < 129000`). Diverifikasi user → keputusan:
  **yearly = monthly × 10 (2 bulan gratis)** → pro `1290000`, enterprise `4990000`.
- Sinkron semua tempat: backend `PRICES` + `PlanGatingTest::test_subscription_prices_match_new_plans`
  + landing `PricingSection` + `upgrade/page.jsx`.
- Bonus fix: kalkulasi badge "Hemat" ikut dibenahi (per bulan / vs bulanan),
  dulu bakal jadi angka negatif dengan harga baru.

### 7. Job Queue (mulai dari roadmap skalabilitas)
- `SendWhatsAppReceipt` job, kirim struk WA jadi **async** dari webhook
  Midtrans (`TransactionController::webhook()`) & `OrderController::updateStatus()`.
  Webhook balas 200 cepat tanpa menunggu respons API Fonnte.
- `ProcessAiJob` + tabel `ai_jobs`, panggilan LLM (Groq/OpenRouter) dipindah
  dari request chat ke queue worker. Endpoint AI (`/ai/query`, `/ai/predict-stock`,
  `/ai/recommend`) kini **202 + `job_id`**, frontend mem-poll
  `GET /api/ai/jobs/{id}` sampai `completed`/`failed`. **Prompt tetap dibangun
  di controller** (masih konteks `auth()` → isolasi tenant aman); job hanya
  memanggil LLM & menulis hasil, tidak ada query database tenant di worker.
- Frontend `aiService.js` meng-poll job di balik layar → `aiStore`/`AISidebar`
  **tidak berubah sama sekali** (tetap menunggu satu promise).
- Queue worker: `entrypoint.sh` Railway sekarang set `QUEUE_CONNECTION=database`
  + jalan `php artisan queue:work` di background.
- Test: `QueueJobTest` (6 test), job LLM sukses/gagal, polling 202→completed,
  403 antarnaya, dispatch WhatsApp on paid, dan job mengimplement `ShouldQueue`.

### 8. Rate limiting global (semua route /api)
- **bootstrap/app.php**: `$middleware->throttleApi('api')` → throttle global untuk
  semua route API, di samping throttle per-route yang ada (login 5,1, AI 10,1,
  insight 5,1).
- **Limiter `api`** di `AppServiceProvider::configureRateLimiting()`:
  - User login → **120 req/menit** per user.
  - Route publik → **60 req/menit per IP**.
  - **Exempt (Limit::none)**: `webhook/*` (Midtrans & retry), `media/*` (browser
    load banyak gambar paralel), `ai/jobs/*` & `ai/usage-today` (frontend polling
    2 detik, sengaja tanpa throttle di design).
- Frontend sudah tangani 429 via interceptor `axios.js` (toast, tanpa logout).
- Test: `RateLimitGlobalTest` (5 test), limiter terdaftar, exemption webhook/
  media/polling, 429 setelah >120 request per user, login tetap 5,1, media lolos
  di burst.

### 9. Redis support (opsional, fallback aman)
- **Client predis** (pure-PHP) sebagai default, Dockerfile `php:8.4-fpm` tidak
  meng-install ekstensi phpredis; `predis/predis` sudah ada di composer.
- `config/database.php`: `REDIS_CLIENT` default `phpredis` → `predis`.
- `entrypoint.sh`: kalau `REDIS_URL` di-set (Railway plugin Redis) →
  `CACHE_STORE`/`SESSION_DRIVER`/`QUEUE_CONNECTION` otomatis ke `redis`;
  kalau kosong → fallback database/file (perilaku lama, tidak ada perubahan).
- `.env.example`: blok Redis opsional ditambahkan.
- Test: `RedisConfigTest` (2 test), default client predis & fallback non-redis.
-  Belum dideploy pakai Redis sungguhan, tinggal add plugin Redis di Railway
  (isi env `REDIS_URL`) lalu redeploy; sisanya otomatis dari entrypoint.

---

## TODO, Belum dikerjakan (lanjutkan dari sini)

### Deploy backend ke Render.com (sesi berjalan)
- **Sudah disiapkan di repo**:
  1. `render.yaml` (blueprint) di root, Web Service docker `rootDir: backend`,
     health check `/up`, env var dengan `sync: false` untuk secret.
  2. `backend/.dockerignore`, exclude `.env` lokal, `vendor/`, `node_modules/`,
     `tests/`, dll supaya build context kecil & secret tidak bocor ke image.
  3. `entrypoint.sh`, ditambah env yang selama ini TERLEWAT: `MYSQL_ATTR_SSL_CA`
     & `MYSQL_ATTR_SSL_VERIFY_SERVER_CERT` (TiDB Cloud butuh TLS!), `FRONTEND_URL`
     (default `https://sikasirai.com`), `SANCTUM_STATEFUL_DOMAINS`, blok `MAIL_*`,
     `FONNTE_TOKEN`, `AI_*` limits, `MIDTRANS_NOTIFICATION_URL`, `APP_LOCALE`,
     `LOG_LEVEL`.
  4. Bug fix: `config/database.php` `(bool) env('MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')`
     → `filter_var(..., FILTER_VALIDATE_BOOLEAN)`, sebelumnya string `"false"` di-.env
     jadi `true` di PHP (bug nyata, koneksi TiDB bisa gagal verifikasi cert).
  - Test: 69/69 lolos.
- **Langkah deploy** (manual di dashboard Render, butuh akun + hubungkan GitHub):
  1. Push commit ini ke GitHub.
  2. https://render.com → New → **Blueprint** → pilih repo ini → Render baca `render.yaml`.
  3. Isi secret env (yang `sync: false`) di dashboard: `APP_URL`
     (`https://kasirai-backend.onrender.com`), `APP_KEY` (`php artisan key:generate --show`),
     `DB_HOST` = `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`, `DB_PORT` = `4000`,
     `DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` TiDB, `MIDTRANS_*`, `GROQ_API_KEY`,
     `OPENROUTER_API_KEY`, `FONNTE_TOKEN`, `MAIL_USERNAME`/`MAIL_PASSWORD`,
     `R2_*` (akses R2). `MYSQL_ATTR_SSL_CA` biarkan kosong (TLS tanpa verify cert).
  4. Deploy pertama → tunggu live → test `GET {APP_URL}/up` (200) & `/api/check-tenant`.
  5. Update `NEXT_PUBLIC_API_URL` di Vercel ke `https://kasirai-backend.onrender.com`
     (redeploy tanpa cache).
-  Catatan: plan gratis Render tidur setelah ~15 menit idle → cold start; health check
  `/up` sudah ada (Laravel 11 `health:` di `bootstrap/app.php`). Redis opsional tetap
  didukung (isi `REDIS_URL` kalau mau).

### Perlu validasi bisnis
1. **Poin P0 lain dari plan awal**, sesi sebelumnya berjalan berdasarkan daftar
   prioritas user yang tidak tersimpan. Kalau masih ada sisa P0/P1, tempel ulang
   daftarnya supaya bisa diteruskan. Fitur yang sudah dikerjakan sejauh ini adalah
   batch P0: inventory ledger, audit log, CRM customer, AI insight/forecast,
   product cost & profit, export COGS/profit, & harga yearly.

### Catatan skalabilitas (sudah terdokumentasi di CLAUDE.md, belum dikerjakan)
2. ~~Redis untuk CACHE_STORE / QUEUE_CONNECTION / SESSION_DRIVER (saat ini `database`).~~ 
   **SUDAH dikerjakan (kode + fallback)**, §9. Tinggal deploy: add Redis plugin
   di Railway, isi env `REDIS_URL`, redeploy. Tanpa `REDIS_URL` tetap jalan
   database/file.
3. ~~Job queue untuk kirim WhatsApp & panggilan AI (saat ini sinkron di webhook/request)~~ 
   **SUDAH dikerjakan**, batch job queue selesai (lihat §7 di "Fitur yang SUDAH dikerjakan").
   Tersisa: InsightService masih memanggil Groq sinkron saat generate (opsional, sudah ada
   fallback templated), dan AI chat async perlu Redis kalau mau dua worker non-blocking.
4. ~~Rate limiting global di `bootstrap/app.php` (saat ini hanya throttle per-route).~~ 
    **SUDAH dikerjakan**, §8 di "Fitur yang SUDAH dikerjakan".

---

## 21 Agustus 2026, Fix: kategori & gambar produk "GONE" di akun nabila (Maung Store)

- **Gejala**: di `nabila@gmail.com` / tenant Maung Store, kategori & gambar produk
  tidak muncul padahal masih ada di DB/R2.
- **Akar masalah**: `TenantScope` (`backend/app/Scopes/TenantScope.php`) menyembunyikan
  seluruh row `products`/`categories` yang `tenant_id`-nya tidak cocok dengan
  `tenant_id` user login. Riwayat commit menunjukkan tenant toko Nabila berulang kali
  dibuat/di-rename/re-assign ("Nabila Store" → "Maung Store", lempar `tenant_id` 2),
  sehingga produk & kategori hasil upload UI **tertinggal di tenant lama (yatim)**.
  Data tidak terhapus, cuma tidak kelihatan di UI, termasuk gambar R2-nya (karena
  `image_url` di-generate dari row produk yang tersembunyi).
- **Fix**:
  - Tambah command idempoten `php artisan kasirai:repair-nabila`
    (`backend/app/Console/Commands/RepairNabilaTenant.php`) yang memindahkan produk &
    kategori **yatim** (milik tenant tanpa user) ke Maung Store, lalu memetakan ulang
    `product.category_id` ke kategori se-nama di tenant yang sama. Aman di DB
    multi-tenant (TIDAK memindahkan toko lain yang sah).
  - Command dipanggil otomatis di akhir `DatabaseSeeder` → self-heal tiap deploy
    (entrypoint jalan `db:seed --force`).
  - Hapus konsolidasi rapuh di `UserSeeder` (jalankan sebelum data ada → no-op, dan
    bisa salah pilih tenant via `Tenant::find(2)`).
- **Cara terapkan di production sekarang**: deploy ulang (atau `railway run php artisan
  kasirai:repair-nabila` di container), kategori & gambar akan kembali tanpa kehilangan
   file R2.

---

## 23 Agustus 2026, Filter tenant di menu Produk & Kategori (akun Developer)

- **Fitur**: akun developer (tenant_id = null, role `developer`) yang sebelumnya melihat
  SEMUA produk & kategori dari semua tenant sekaligus, kini punya **dropdown pilih
  tenant** di halaman Produk & Kategori. Pilih satu tenant → hanya produk/kategori
  tenant itu yang tampil (lebih terorganisir). Default "Semua Tenant" = perilaku lama.
- **Backend**:
  - `ProductController::index()` & `CategoryController::index()` menerima query param
    `tenant_id` yang **hanya dihormati untuk role `developer`** (aman: non-developer
    tetap terisolasi tenant sendiri via TenantScope, param diabaikan).
  - Developer kini **bebas read-limit** (tidak kena cap 50/15 produk/kategori seperti
    plan Free), dev tools lintas tenant tetap pakai pagination normal.
- **Frontend**:
  - `products/page.jsx` & `categories/page.jsx`: selector tenant (`useAuthStore.isDeveloper()`),
    mengambil daftar via `tenantService.getAll()`. Di Produk, `tenant_id` diteruskan ke
    `useProducts` (filter) dan ke dropdown kategori (ikut tenant terpilih).
- **Test**: `TenantIsolationTest` +2 test, developer bisa filter produk/kategori per
  tenant; non-developer tidak bisa cross-tenant lewat param. Total 6 test lolos.
-  **Catatan**: pembuatan produk/kategori oleh developer tetap `tenant_id = null`
  (perilaku lama di `store()`), di luar scope filter ini. Kalau mau developer membuat
  produk ke tenant tertentu, perlu tambah `tenant_id` di payload `store()` (TODO).
