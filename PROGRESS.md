# PROGRESS, KasirAI (Catatan Kemajuan & TODO)

> File ini dicatat oleh agen AI / developer di akhir sesi kerja.
> **Baca dulu sebelum melanjutkan pekerjaan** supaya tahu apa yang sudah
> beres dan apa yang harus dikerjakan berikutnya.

## Status Terakhir

- Tanggal: 19 Agustus 2026
- Database: **100% TERMIGRASI & TERISI (SEEDED) KE TIDB CLOUD!** (Cluster: `kasirai-db`, Host: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`, SSL Active).
- Git: Terakhir commit `docs & config: update database ssl settings and tidb migration progress`.
- Backend Deployment: **Render.com** (bukan Railway/Fly), blueprint `render.yaml` + `backend/.dockerignore` + fix entrypoint env sudah siap di repo. **Sudah di-deploy & live (dikonfirmasi user).**
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
- **UPDATE (OTP)**: alur link diganti **kode OTP 6 digit** (blok "Alur/Backend/Frontend" di
  bawah ini adalah versi LINK LAMA, hanya untuk sejarah). Alur sekarang: `/forgot-password`
  satu halaman 3 tahap (email → OTP + password baru → sukses). `POST /api/forgot-password`
  buat OTP (`random_int`, disimpan **ter-hash** di Cache `pwd_otp:{email}`, TTL 10 menit,
  hangus setelah 5 kali salah, jeda kirim ulang 60 detik `pwd_otp_cd:{email}`), lalu
  `POST /api/reset-password {email, otp, password, password_confirmation}` verifikasi + ganti
  password + cabut semua token Sanctum. Tanpa migration baru; `PasswordBroker` tidak dipakai
  lagi. `ResetPasswordMail(user, otp, expiresMinutes=10)` tetap `ShouldQueue`. Halaman
  `/reset-password` & route publiknya dihapus. 82 test lolos (`PasswordResetTest` 12 test).
- **AKAR MASALAH email tidak terkirim (21 Sep 2026)**: log Render `Unable to connect to
  smtp.gmail.com:587 (Connection timed out)`, Render memblokir port SMTP keluar, jadi
  Gmail SMTP tidak bisa dipakai (bukan soal App Password/OAuth). Solusi: kirim via **Resend
  (HTTPS API)**: `composer require resend/resend-php`, `MAIL_MAILER=resend`, env `RESEND_API_KEY`,
  `MAIL_FROM_ADDRESS=noreply@sikasirai.com` (harus domain terverifikasi di Resend), `render.yaml`
  & `entrypoint.sh` disesuaikan. `ResetPasswordMail` diberi `$tries=2`/`$timeout=30` supaya
  email macet tidak menyandera worker queue tunggal (job WhatsApp/AI ikut tertahan).
  **Tinggal manual**: daftar Resend → verifikasi domain sikasirai.com di DNS Domainesia →
  buat API key → isi env di Render (`MAIL_MAILER=resend`, `RESEND_API_KEY`, `MAIL_FROM_ADDRESS`),
  hapus `MAIL_USERNAME`/`MAIL_PASSWORD`, cabut App Password Gmail lama.
- **STATUS 22 Sep 2026: OTP via Resend BERHASIL di production & domain `sikasirai.com` sudah
  VERIFIED di Resend** (DNS di Domainesia: DKIM TXT `resend._domainkey`, CNAME `rsend` & `send`,
  TXT `_dmarc`). `MAIL_FROM_ADDRESS=noreply@sikasirai.com` (sama dengan `render.yaml`), jadi
  OTP bisa dikirim ke SEMUA user, bukan hanya pemilik akun Resend. Jangan hapus record DNS
  Resend tsb. **Tinggal**: tes kirim OTP ke email user selain pemilik akun Resend; pastikan
  App Password Gmail lama & API key Resend lama sudah dicabut.
- **Alur (lama, versi link)**: login page → "Lupa password?" → `/forgot-password` → isi email →
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
    `MAIL_SCHEME=smtp` (BUKAN `tls`, Symfony Mailer hanya kenal `smtp`/`smtps`; port 587
    otomatis STARTTLS), Laravel 11 pakai `MAIL_SCHEME`, BUKAN `MAIL_ENCRYPTION`,
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
- **Fix 21 Sep 2026**: link di email dulu `/auth/reset-password` (404), sekarang
  `/reset-password` (URL asli halaman; `(auth)` cuma folder pengelompok). `render.yaml`
  + `MAIL_MAILER=smtp` (sebelumnya default `log` = email tidak terkirim). 7 test lolos.
- **Fix 20 Sep 2026 (lanjutan)**: `POST forgot-password` 500 di production. `ResetPasswordMail`
  kini `ShouldQueue` (email dikirim worker, request tidak lagi menunggu SMTP);
  `entrypoint.sh` default `LOG_CHANNEL=stderr` supaya error Laravel tampil di tab Logs Render;
  bug seeder `DatabaseSeeder` (`$this->call(RepairNabilaTenant)` → `$this->command->call('kasirai:repair-nabila')`).
  77 test lolos. Email harus pakai **App Password Gmail** (bukan password akun).
- **Tinggal manual di Render**: isi `MAIL_USERNAME` + `MAIL_PASSWORD` (App Password Gmail
  16 karakter), redeploy, lalu uji dari sikasirai.com/forgot-password. Kalau timeout,
  kemungkinan port SMTP diblokir plan gratis Render → pindah ke Resend (HTTPS).

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
- Queue worker: `entrypoint.sh` sekarang set `QUEUE_CONNECTION=database`
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
- `entrypoint.sh`: kalau `REDIS_URL` di-set (Render Redis / eksternal) →
  `CACHE_STORE`/`SESSION_DRIVER`/`QUEUE_CONNECTION` otomatis ke `redis`;
  kalau kosong → fallback database/file (perilaku lama, tidak ada perubahan).
- `.env.example`: blok Redis opsional ditambahkan.
- Test: `RedisConfigTest` (2 test), default client predis & fallback non-redis.
-  Belum dideploy pakai Redis sungguhan, tinggal add Redis di Render
  (isi env `REDIS_URL`) lalu redeploy; sisanya otomatis dari entrypoint.

---

## TODO, Belum dikerjakan (lanjutkan dari sini)

### ✅ SELESAI: Deploy backend ke Render.com (sudah dijalankan manual oleh user)
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
   di Render, isi env `REDIS_URL`, redeploy. Tanpa `REDIS_URL` tetap jalan
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

---

## 3 Oktober 2026, Unit & security testing Login / Register / Forgot Password (issue #2)

- **Pest 4 terpasang** (dev dependency, `backend/composer.json`) berdampingan dengan PHPUnit; `tests/Pest.php` hanya mengatur folder `Feature/Auth/Pest`.
- **263 test baru** di `backend/tests/Feature/Auth/` (PHPUnit: login, register, forgot/reset, batas input & karakter khusus, token kedaluwarsa; Pest: SQLi, brute force, credential stuffing, CSRF, XSS, token theft, enumeration, phishing). Suite penuh sekarang **345 test lulus**.
- Helper `tests/Support/DisposableAuthUser.php`: data user/tenant baru per test, dihapus di akhir + `assertDatabaseMissing`, guard DB harus sqlite `:memory:`.
- Test yang perilakunya belum sesuai ekspektasi **tidak di-commit** (`backend/tests-private/`, di-gitignore); laporan lengkap di `backend/tests/Feature/Auth/TEST_REPORT_AUTH.md` (di-gitignore, privat karena repo publik).
- **TODO**: tindak lanjuti laporan privat, lalu pindahkan test yang sudah hijau dari `tests-private/` ke `tests/Feature/Auth/`.

---

## 3 Oktober 2026, Kurangi cold start Render (issue #5)

- **Bagian A (keep-alive) AKTIF**: monitor UptimeRobot (HEAD `https://kasirai-backend-56l1.onrender.com/up`, tiap 5 menit, email alert). Jangan tambah monitor kedua. Catatan: URL backend asli ada akhiran `-56l1`, beda dengan komentar di `render.yaml`. **TODO owner**: verifikasi 1 jam (tidak ada event tidur di Render) & cek ada/tidaknya service gratis lain (jatah ±750 jam/bulan).
- **Bagian B (frontend) selesai**: helper baru `frontend/src/lib/warmup.js` (`warmUpBackend()` → `GET {origin}/up`, tidak pernah throw, dedupe request bersamaan, dianggap hangat 5 menit via `sessionStorage`, timeout 90 dtk; origin diturunkan dari `NEXT_PUBLIC_API_URL`, tidak di-hardcode).
- Login: ping lama `GET /api/login` (405) diganti `warmUpBackend()`; overlay kura-kura baru muncul kalau `/up` belum menjawab setelah 800 ms; kalau server tidak terjangkau tampil pesan error dan form tetap bisa dipakai.
- Warm-up diam-diam juga di landing (`components/landing/BackendWarmup.jsx`), register, dan forgot-password.
- CORS dicek langsung di production: `/up` mengirim `access-control-allow-origin: *`, jadi `fetch` biasa cukup (tanpa `no-cors`).
- Teruji: `npm run build` sukses; logika `warmup.js` diuji dengan script Node (dedupe, cache 5 menit, gagal, timeout, env kosong). **Belum diuji manual di browser** (T1-T8 di issue #5, terutama T4/T5 untuk tampilan overlay & pesan error).

---

## 3 Oktober 2026, Video demo marketing Remotion (issue #7)

- Project baru di folder **`video/`** (terpisah dari `frontend/` & `backend/`, `package.json` sendiri, Remotion 4.0.532 dipin). Hasil render: `video/out/sikasirai-demo.mp4` (H.264, 1920x1080, 30 fps, 2:16, audio AAC), **tidak di-commit** (`.gitignore`).
- 8 scene: Intro, Problem, Solution, Demo Login, Demo Kasir (buka shift + keranjang), Demo Transaksi (tunai, QRIS, struk WhatsApp), Demo Laporan (dashboard, laba kotor, export, AI), Outro (manfaat + harga + CTA). Layar aplikasi **dibuat ulang sebagai komponen React** (bukan rekaman layar), data fiktif toko "Kopi Senja" di `video/src/data/demo.ts`. PPN 11% ikut ditampilkan sesuai aplikasi (total contoh Rp 57.720, bukan Rp 52.000 seperti draf issue).
- Musik latar & semua sound effect **dibuat sendiri lewat sintesis** (`npm run audio`), tanpa lisensi pihak ketiga. Detail di `video/CREDITS.md`.
- **Narasi masih PLACEHOLDER** (TTS `id-ID-GadisNeural` via paket tidak resmi `msedge-tts`). **Wajib diganti** (rekaman suara manusia atau TTS berlisensi komersial) sebelum dipublikasikan. Waktu kalimat narasi disimpan di `src/data/vo-timing.json` supaya animasi & caption tersinkron.
- Teruji: `tsc` bersih, render penuh sukses, frame hasil MP4 dicek, audio dicek (puncak 0,94, tanpa clipping). **Belum didengar/ditonton oleh manusia**, jadi sinkron audio-visual dan kenyaringan belum dikonfirmasi.
- **TODO owner** (pertanyaan issue #7 bagian 11): sumber suara final & persetujuan naskah, nama merek "KasirAI" (logo) vs "SiKasirAI" (narasi/domain), maskot kura-kura (tidak dipakai), lokasi unggah video final, review draf.

---

## 3 Oktober 2026, Audit desain: P0 kepercayaan & kebenaran klaim (issue #10)

- **Klaim yang tidak sesuai kode dihapus/dibetulkan** di landing: "trial 14 hari" (tidak ada fitur trial, backend `is_trial => false`), "2.000+ pebisnis", "Multi-Outlet" (diganti kartu "Struk ke WhatsApp" yang memang ada), "Support 7 hari seminggu", "Setup 5 menit", nama model AI ("Groq/LLaMA") di UI pengguna (kini hanya tampil untuk developer), badge "Sistem berjalan normal" (statis), serta teks "14 hari" di meta SEO & JSON-LD (`app/layout.jsx`).
- **Halaman baru**: `/kebijakan-privasi` dan `/syarat-ketentuan` (route group `app/(legal)`, komponen `components/legal/LegalPage.jsx`), ditambahkan ke `OPEN_ROUTES` di `middleware.js` (tidak di-redirect walau sudah login) dan `sitemap.js`. **Isi masih DRAF** dari alur data aplikasi, wajib ditinjau owner/penasihat hukum.
- **FAQ**: `components/landing/FAQSection.jsx` (`#faq`, 8 pertanyaan, semua jawaban dicek ke kode). Link footer yang `href="#"` diganti link nyata; "Dokumentasi" & "Status" dihapus.
- Kontak dipusatkan di `src/lib/contact.js`.
- **Belum dikerjakan (butuh keputusan owner)**: testimoni (komponen `TestimonialsSection` tidak dipasang di `page.jsx`, jadi tidak tampil), email resmi domain (P0-9), nama merek KasirAI vs SiKasirAI, klaim fitur Enterprise (lintas cabang, API kustom, training on-site) & "outlet" di halaman Profil, kebijakan pembatalan/refund.
- **Temuan di luar issue**: tidak ada proses otomatis yang menurunkan paket saat langganan berakhir (`expires_at` hanya dipakai untuk tampilan status). Perlu diputuskan apakah user kembali ke Free otomatis.

---

## 4 Oktober 2026, Audit desain: P1 konversi landing page (issue #10)

- **Hero**: foto AI (teks acak, hologram) diganti `HeroProductPreview.jsx`, jendela aplikasi contoh 4 tab (Kasir, Struk WhatsApp, Laporan, AI) dengan label "Contoh tampilan, data fiktif Kopi Senja". Foto latar toko dihapus (juga di section Masalah/Fitur), coretan merah tebal diganti `line-through` tipis, statistik "11%/PDF-XLSX/24/7" diganti tiga manfaat nyata (Rp 0, struk WhatsApp otomatis, QRIS paket Pro).
- **Hierarki CTA**: satu tombol utama hitam per layar ("Mulai Gratis", juga di navbar). Di harga hanya Pro yang hitam. CTA akhir dipisah: Mulai Gratis / Lihat Demo (modal video bersama `DemoVideoModal.jsx`) / tautan kecil Masuk. Kontras teks jaminan dinaikkan.
- **Masalah**: 6 kartu miring jadi 3 kartu lurus. **Fitur**: 3 utama besar (Kasir+struk WA, Laporan laba, AI hitam) + 3 pendukung ringkas; chip label & panel "Fitur Unggulan AI" (duplikat AI Spotlight) dihapus.
- **Harga**: **bug diperbaiki**, toggle Tahunan menampilkan Rp 1.290.000 berlabel "/bulan"; kini "/tahun" + setara per bulan + hemat. Label toggle "Hemat 2 bulan", tabel perbandingan Free/Pro/Enterprise (sinkronkan dengan batas di backend), tanda ✓/✕ pada daftar fitur (sebelumnya ikon kosong).
- `scroll-mt-28` di semua section anchor agar tidak tertutup navbar. Gambar yang tak terpakai (frame1-4, bacground.jpeg) dihapus.
- **Analytics**: `src/lib/analytics.js` (`trackEvent`, aman jika GA belum termuat). Event terpasang: `landing_view`, `cta_click {posisi, tujuan/paket}`. Event aplikasi (register, pesanan pertama, upgrade) menyusul di PR P1-aplikasi.
- Diuji: build sukses; hero, fitur, harga bulanan/tahunan dicek di browser desktop; layout HP 390 px dicek lewat iframe (tanpa overflow horizontal).

---

## 4 Oktober 2026, Audit desain: P1 aktivasi & upgrade di aplikasi (issue #10)

- **Checklist onboarding** (`components/dashboard/OnboardingChecklist.jsx`) di dashboard: tambah produk, buka shift, transaksi pertama, coba AI (khusus yang punya akses AI). Status dari data nyata (total produk, riwayat shift, pesanan lunas, flag `kasirai_ai_used` di localStorage yang di-set `aiStore`). Hilang otomatis kalau selesai atau ditutup (`kasirai_onboarding_dismissed`).
- **Empty state Wawasan**: toko tanpa pesanan lunas melihat ajakan "Wawasan muncul setelah transaksi pertama". **Backend** `InsightService::generateForTenant()` kini tidak memanggil LLM dan menghapus insight lama kalau tidak ada transaksi lunas 30 hari terakhir (sumber teks "Revenu minggu ini 0" yang tadi tampil); test baru `test_generate_insight_skips_llm_when_no_recent_sales`.
- **Upgrade kontekstual**: `stores/upgradeModalStore.js` + `components/ui/UpgradeModal.jsx` (dipasang di layout dashboard & kasir). Dipicu dari kasir (tombol DIGITAL kini AKTIF untuk Free dan membuka modal, sebelumnya `disabled` sehingga tidak pernah terlihat; juga untuk 422 `plan_required`), laporan (tombol PDF/Excel terkunci, juga 403), dan banner kuota AI habis. Harga dibaca dari `PLANS`. Kasir (bukan admin) diarahkan menghubungi pemilik toko.
- **Panel AI desktop** bisa disembunyikan (tombol `›`, tab "AI ASSISTANT" di tepi kanan). Pilihan diingat (`kasirai_ai_panel`); default terbuka hanya di `/dashboard`. Teks banner kuota yang salah ("AI tak terbatas") dibetulkan, tombol tutup panel mobile yang kosong diberi ikon.
- **Navbar** diratakan: judul halaman, nama, peran, paket tidak lagi diulang (ada di judul halaman & kartu akun sidebar). Tersisa menu/logo (mobile), tombol "Upgrade ke Pro" (khusus admin paket Free), dan Keluar.
- **Event GA4 funnel** lengkap: `register_start`, `register_success`, `product_created_first`, `shift_opened_first`, `order_paid_first`, `upgrade_view`, `upgrade_payment_success` (+ `upgrade_prompt_view`). Event "first" memakai `trackOnce` (penanda localStorage per browser, jadi perkiraan per perangkat).
- Diuji end-to-end di lokal dengan SQLite sementara (tanpa Midtrans): login, checklist 0/4 → 3/4 setelah transaksi tunai, modal upgrade dari kasir & laporan, panel AI tersimpan lintas halaman. Backend: 346 test lulus.

---

## 4 Oktober 2026, Audit desain: P2 design system (issue #10)

- **Token warna satu sumber** di `src/app/globals.css` (`:root`, triplet `--x-rgb` + versi penuh `--ink`, `--yellow`, `--success`, `--danger`, `--warning`, `--info`, `--accent`); `tailwind.config.js` membacanya dengan `rgb(var(--x-rgb) / <alpha-value>)` sehingga `bg-brand-black/50` tetap jalan. Token semantik baru: `success`, `danger`, `warning`, `info`, `accent`, `text-ink-muted`.
- **Hex tertanam turun 464 -> ~138** lewat codemod mekanis (222 string shadow, 35 class arbitrary, 77 style-object, 87 warna di CSS). Sisa hex sengaja dibiarkan: grafik Recharts, logo SVG, HTML struk cetak (konteks tanpa CSS variable), putih murni.
- **Komponen bersatu**: `NeoButton` (varian `cta`, `inverse`, `primary`, `secondary`, `dark`, `outlineLight`, `ghost`, `danger`; ukuran sm-xl; `loading`; fokus keyboard; helper `neoButtonClass()` untuk `<Link>`) dan `NeoCard` (varian default/highlight/dark, ukuran md/lg). **Kartu kini bersudut tegas** (sebelumnya `rounded-md` di dashboard, tegas di landing). Dipakai di landing (hero, navbar, harga, CTA, fitur, masalah), modal upgrade, checklist, navbar aplikasi. `NeoBadge` memakai token semantik (nama lama green/red/blue/orange tetap alias).
- **Skala tipografi**: `text-display`, `text-h1..h4`, `text-body`, `text-small`, `text-caption` (responsif lewat `clamp`). Dipakai di judul landing dan judul halaman aplikasi. `font-mono` di landing dibatasi untuk angka/harga/kode (label & chip pindah ke Space Grotesk).
- Kartu Wawasan KasirAI mengikuti gaya neobrutal. **Dokumentasi**: `frontend/DESIGN_SYSTEM.md` (aturan warna termasuk aturan pemakaian kuning, tipografi, komponen, spasi, ikon) dan katalog hidup `/dev/design-system` (khusus developer, di balik PIN).
- Diuji: build sukses; landing, dashboard, dan katalog dicek di browser (stack lokal SQLite).
- **Temuan di luar issue** (PIN Developer Portal yang tertulis di kode): **sudah diperbaiki**, lihat bagian "Gerbang Developer Portal" di bawah.

---

## 4 Oktober 2026, Gerbang Developer Portal dipindah ke server (hapus PIN)

- **Masalah**: `/dev/*` dijaga PIN di sisi browser (`NEXT_PUBLIC_DEV_PIN ?? "kasiradev2025"`) atau daftar email; variabel `NEXT_PUBLIC_*` terbundel ke JavaScript browser dan nilai cadangannya ada di repo publik, jadi siapa pun bisa membuka halaman portal. (Data tetap aman: semua endpoint API `/api/dev/*` sudah dikunci `role:developer`.)
- **Perbaikan**: PIN, `DEV_EMAIL`, dan `sessionStorage dev_verified` dihapus total. `src/middleware.js` kini memverifikasi peran ke backend (`GET /api/me` dengan token dari cookie) untuk setiap permintaan `/dev/*`; hanya `role === "developer"` dan akun aktif yang lolos. Gagal verifikasi, backend tidak menjawab, atau timeout 8 detik: dialihkan ke `/dashboard` (fail closed). `dev/layout.jsx` tinggal lapis kedua (alihkan kalau user termuat tapi bukan developer, muat ulang user kalau kosong).
- **Test**: `DevRoutesAccessTest` (5 test): tamu 401, admin/kasir/user 403, developer 200, developer nonaktif 403, dan kontrak `/me` (`data.role`, `data.is_active`) yang dipakai gerbang frontend. Total 351 test lulus.
- Diuji di lokal: tanpa login ke /login, token palsu dan admin ke /dashboard, developer 200 tanpa PIN, backend mati ditolak, login developer di browser langsung masuk portal.
- **TODO owner**: hapus env `NEXT_PUBLIC_DEV_PIN` di Vercel kalau ada (sudah tidak dipakai). Satu hal yang berubah: akun `donojomi@gmail.com` tidak lagi otomatis lolos lewat email; akun itu harus benar-benar berperan `developer` di database.

### Satu-satunya developer = donojomi@gmail.com
- Email resmi di `backend/config/kasirai.php` (env `DEVELOPER_EMAIL`, default donojomi@gmail.com). Helper `User::developerEmail()` / `isDeveloperEmail()`.
- Middleware `single.developer` (di grup `auth:sanctum`): akun berperan developer dengan email lain ditolak 403 di semua endpoint.
- `UserController` (store/update/patchRole) menolak memberi peran developer ke email lain (422); akun resmi tidak bisa diturunkan/dinonaktifkan/diganti emailnya.
- `UserSeeder` tidak lagi menulis sandi `developer123` dan tidak mereset sandi akun yang sudah ada (sandi baru dari env `DEVELOPER_SEED_PASSWORD` atau acak).
- Command `php artisan kasirai:developer-audit` mendaftar akun developer dan menandai yang tidak sah.
- Test: `SingleDeveloperTest` (361 test lulus).
- **TODO owner**: pastikan akun donojomi@gmail.com berperan `developer` di DB production; ganti sandi lewat Lupa Password (sandi lama `developer123` pernah ada di repo publik); jalankan `kasirai:developer-audit` di production; hapus env `NEXT_PUBLIC_DEV_PIN` di Vercel.

## 4 Oktober 2026, P3 polish (issue #10)
- **Keputusan nama merek: KasirAI** (domain tetap sikasirai.com). Di kode aplikasi sudah konsisten; "SiKasirAI" hanya ada di `video/` dan kini diganti (komposisi `KasirAIDemo`, output `kasirai-demo*.mp4`). **TODO**: suara narasi video masih menyebut "Si Kasir A I"; rekam ulang narasi lalu render ulang sebelum mengganti video di landing.
- **Fokus keyboard**: aturan `:focus-visible` global di `globals.css` (garis luar hitam, kuning di latar gelap; input tidak lagi hanya berganti border kuning).
- **Landing**: audit 360/390/768px, tidak ada scroll horizontal; target sentuh link footer diperbesar. Gambar produk di kasir & produk di-lazy-load.
- **Belum**: audit mobile kasir & dashboard (butuh login/backend lokal), ukur LCP dengan Lighthouse di production, tombol navbar mobile masih 36-40px.
