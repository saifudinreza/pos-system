# PROGRESS — KasirAI (Catatan Kemajuan & TODO)

> File ini dicatat oleh agen AI / developer di akhir sesi kerja.
> **Baca dulu sebelum melanjutkan pekerjaan** supaya tahu apa yang sudah
> beres dan apa yang harus dikerjakan berikutnya.

## Status Terakhir

- Tanggal: 9 Agustus 2026
- Git: working tree bersih (semua sudah commit & push)
  - `835f8ef feat:Product Cost & Profit`
  - `9659aac feat:add admin customer list`
- Backend: **55 test PHPUnit lulus** (sqlite `:memory:`)
- Frontend: `npm run build` sukses

---

## Fitur yang SUDAH dikerjakan

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
- `ForecastService` — prediksi 7 hari (deterministik, gratis, tanpa LLM):
  rata-rata per hari-of-week dari 35 hari terakhir. Endpoint `GET /api/reports/forecast`.
- `InsightService` + `InsightController` — AI menulis insight (penjualan/stok/
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
- Bonus fix: kalkulasi badge "Hemat" ikut dibenahi (per bulan / vs bulanan) —
  dulu bakal jadi angka negatif dengan harga baru.

### 7. Job Queue (mulai dari roadmap skalabilitas)
- `SendWhatsAppReceipt` job — kirim struk WA jadi **async** dari webhook
  Midtrans (`TransactionController::webhook()`) & `OrderController::updateStatus()`.
  Webhook balas 200 cepat tanpa menunggu respons API Fonnte.
- `ProcessAiJob` + tabel `ai_jobs` — panggilan LLM (Groq/OpenRouter) dipindah
  dari request chat ke queue worker. Endpoint AI (`/ai/query`, `/ai/predict-stock`,
  `/ai/recommend`) kini **202 + `job_id`**, frontend mem-poll
  `GET /api/ai/jobs/{id}` sampai `completed`/`failed`. **Prompt tetap dibangun
  di controller** (masih konteks `auth()` → isolasi tenant aman); job hanya
  memanggil LLM & menulis hasil — tidak ada query database tenant di worker.
- Frontend `aiService.js` meng-poll job di balik layar → `aiStore`/`AISidebar`
  **tidak berubah sama sekali** (tetap menunggu satu promise).
- Queue worker: `entrypoint.sh` Railway sekarang set `QUEUE_CONNECTION=database`
  + jalan `php artisan queue:work` di background.
- Test: `QueueJobTest` (6 test) — job LLM sukses/gagal, polling 202→completed,
  403 antarnaya, dispatch WhatsApp on paid, dan job mengimplement `ShouldQueue`.

### 8. Rate limiting global (semua route /api)
- **bootstrap/app.php**: `$middleware->throttleApi('api')` → throttle global untuk
  semua route API, di samping throttle per-route yang ada (login 5,1 — AI 10,1 —
  insight 5,1).
- **Limiter `api`** di `AppServiceProvider::configureRateLimiting()`:
  - User login → **120 req/menit** per user.
  - Route publik → **60 req/menit per IP**.
  - **Exempt (Limit::none)**: `webhook/*` (Midtrans & retry), `media/*` (browser
    load banyak gambar paralel), `ai/jobs/*` & `ai/usage-today` (frontend polling
    2 detik — sengaja tanpa throttle di design).
- Frontend sudah tangani 429 via interceptor `axios.js` (toast, tanpa logout).
- Test: `RateLimitGlobalTest` (5 test) — limiter terdaftar, exemption webhook/
  media/polling, 429 setelah >120 request per user, login tetap 5,1, media lolos
  di burst.

---

## TODO — Belum dikerjakan (lanjutkan dari sini)

### Perlu validasi bisnis
1. **Poin P0 lain dari plan awal** — sesi sebelumnya berjalan berdasarkan daftar
   prioritas user yang tidak tersimpan. Kalau masih ada sisa P0/P1, tempel ulang
   daftarnya supaya bisa diteruskan. Fitur yang sudah dikerjakan sejauh ini adalah
   batch P0: inventory ledger, audit log, CRM customer, AI insight/forecast,
   product cost & profit, export COGS/profit, & harga yearly.

### Catatan skalabilitas (sudah terdokumentasi di CLAUDE.md, belum dikerjakan)
2. Redis untuk CACHE_STORE / QUEUE_CONNECTION / SESSION_DRIVER (saat ini `database`).
3. ~~Job queue untuk kirim WhatsApp & panggilan AI (saat ini sinkron di webhook/request)~~ ✅
   **SUDAH dikerjakan** — batch job queue selesai (lihat §7 di "Fitur yang SUDAH dikerjakan").
   Tersisa: InsightService masih memanggil Groq sinkron saat generate (opsional, sudah ada
   fallback templated), dan AI chat async perlu Redis kalau mau dua worker non-blocking.
4. ~~Rate limiting global di `bootstrap/app.php` (saat ini hanya throttle per-route).~~ ✅
   **SUDAH dikerjakan** — §8 di "Fitur yang SUDAH dikerjakan".
