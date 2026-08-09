# PROGRESS — KasirAI (Catatan Kemajuan & TODO)

> File ini dicatat oleh agen AI / developer di akhir sesi kerja.
> **Baca dulu sebelum melanjutkan pekerjaan** supaya tahu apa yang sudah
> beres dan apa yang harus dikerjakan berikutnya.

## Status Terakhir

- Tanggal: 9 Agustus 2026
- Git: working tree bersih (semua sudah commit & push)
  - `835f8ef feat:Product Cost & Profit`
  - `9659aac feat:add admin customer list`
- Backend: **42 test PHPUnit lulus** (sqlite `:memory:`)
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
- Test: `ProfitReportTest` (4 test).

---

## TODO — Belum dikerjakan (lanjutkan dari sini)

### Urgent / jelas
1. **Export PDF/Excel laporan penjualan belum memuat COGS & profit.**
   `ReportController::downloadSales()` hanya mengirim transaksi + revenue.
   Tambahkan ringkasan COGS/laba kotor/margin ke blade `reports.sales` dan
   `SalesReportExport` (Excel).

2. **Cleanup duplikasi konfigurasi** di `backend/config/ai.php`:
   key `pro_daily_limit` & `enterprise_daily_limit` ditulis **2 kali**
   (baris 22-23 dan 34-35). Yang pertama dead config (di-overwrite oleh
   yang kedua). Hapus blok duplikat, satu blok sudah cukup.

### Perlu validasi bisnis
3. **Harga Pro yearly kemungkinan salah ketik** — `SubscriptionController::PRICES`:
   `'pro' => ['monthly' => 129000, 'yearly' => 100000]` → 1 tahun hanya 100rb
   (jauh di bawah 1 bulan). Enterprise juga aneh: `499000/bln vs 399000/thn`.
   Kalau ini promo yang disengaja, abaikan. Kalau typo (harusnya 1.290.000 /
   4.990.000), perbaiki **backend PRICES + frontend `subscriptionStore PLANS` +
   landing `PricingSection` + `upgrade/page.jsx` + `profile/page.jsx` sekaligus**
   (aturan: jangan ubah satu tempat tanpa sinkron tempat lain).

### Belum sempat / perlu plan asli
4. **Poin P0 lain dari plan awal** — sesi sebelumnya berjalan berdasarkan daftar
   prioritas user yang tidak tersimpan. Kalau masih ada sisa P0/P1, tempel ulang
   daftarnya supaya bisa diteruskan. Fitur yang sudah dikerjakan sejauh ini adalah
   batch P0: inventory ledger, audit log, CRM customer, AI insight/forecast,
   product cost & profit.

### Catatan skalabilitas (sudah terdokumentasi di CLAUDE.md, belum dikerjakan)
5. Redis untuk CACHE_STORE / QUEUE_CONNECTION / SESSION_DRIVER (saat ini `database`).
6. Job queue untuk kirim WhatsApp & panggilan AI (saat ini sinkron di webhook/request).
7. Rate limiting global di `bootstrap/app.php` (saat ini hanya throttle per-route).
