# PRD — POS System (Inspired by Moka POS)
## Adaptasi Workflow & Fitur Moka POS ke Project Final Bootcamp
**Author:** Saifudin Reza | **Stack:** Next.js 14 · Laravel 11 · MySQL · Groq AI

---

## CATATAN PENTING: MANA YANG BISA DIIMPLEMENTASIKAN?

Moka POS adalah produk enterprise dengan ratusan developer.
Project ini adalah final project bootcamp individu dengan deadline ~2 minggu.
PRD ini sudah dibagi jadi 3 tier:

| Tier | Label | Keterangan |
|------|-------|-----------|
| 🟢 WAJIB | Core | Masuk rubrik penilaian — HARUS ada |
| 🟡 BONUS | Nice to have | Nilai tambah — kerjakan kalau sempat |
| 🔴 SKIP | Future | Terlalu kompleks untuk timeline ini |

---

## 1. WORKFLOW UTAMA (Inspired by Moka POS)

### 1.1 Alur Shift Kasir
Moka POS punya sistem shift — kasir buka dan tutup shift dengan modal kas awal.

```
BUKA SHIFT
Kasir login → Input modal awal kas → Mulai shift → Catat jam mulai

SELAMA SHIFT
Proses transaksi → Semua tercatat di shift aktif

TUTUP SHIFT
Hitung total penjualan → Hitung kas akhir → Rekap shift → Cetak laporan shift
```

**Implementasi di project kamu:**
- 🟢 Kasir login → langsung bisa transaksi (tanpa shift dulu — simplified)
- 🟡 Sistem shift sederhana: buka shift (input modal) → tutup shift (rekap)

---

### 1.2 Alur Transaksi Kasir (Core Workflow)
```
1. Kasir pilih produk → masuk cart
2. Atur qty, tambah diskon item (opsional)
3. Input catatan order (opsional)
4. Pilih tipe order: Dine In / Take Away / Delivery
5. Proses pembayaran:
   ├── Tunai → input nominal → hitung kembalian → cetak struk
   ├── QRIS/GoPay/OVO → Midtrans Snap popup → tunggu konfirmasi
   └── Kartu → Midtrans → konfirmasi
6. Struk tampil → pilih: Print / WhatsApp / Tutup
7. Stok otomatis berkurang
8. Transaksi tersimpan di laporan
```

**Implementasi:**
- 🟢 Pilih produk, cart, checkout, Midtrans payment
- 🟢 Stok auto berkurang
- 🟢 Cetak struk / kirim WhatsApp
- 🟡 Tipe order: Dine In / Take Away
- 🟡 Kembalian tunai calculator
- 🔴 Delivery integration (GoFood, GrabFood)

---

### 1.3 Alur Manajemen Produk & Varian
Moka POS support varian produk (ukuran, warna, topping).

```
Produk → punya Varian → tiap varian punya harga & stok sendiri
Contoh: Kopi Susu
├── Size S → Rp 15.000 → stok: 50
├── Size M → Rp 20.000 → stok: 40
└── Size L → Rp 25.000 → stok: 30
```

**Implementasi:**
- 🟢 Produk tanpa varian (current state — sudah jalan)
- 🟡 Varian sederhana: satu produk bisa punya beberapa opsi harga
- 🔴 Modifier/topping system (terlalu kompleks)

---

### 1.4 Alur Laporan Bisnis
Moka POS punya back office berbasis cloud dengan laporan lengkap.

```
Dashboard → ringkasan hari ini
Laporan Penjualan → per hari/minggu/bulan/custom
Laporan Produk → terlaris, tidak laku, margin
Laporan Stok → masuk/keluar/sisa
Laporan Shift → per kasir, per shift
Laporan Keuangan → HPP, laba rugi
```

**Implementasi:**
- 🟢 Dashboard ringkasan (revenue, order, stok kritis)
- 🟢 Laporan penjualan harian/bulanan + download PDF/Excel
- 🟢 Laporan stok + alert menipis
- 🟡 Laporan per kasir (siapa yang paling banyak jual)
- 🟡 HPP & estimasi laba rugi sederhana
- 🔴 Laporan multi-cabang

---

## 2. FITUR DETAIL PER MODUL

---

### 2.1 🟢 MODUL KASIR (POS Terminal)

**Halaman: `/kasir`**

#### Layout Split Screen:
```
┌──────────────────────────┬─────────────────────┐
│  PRODUK (60%)            │  CART (40%)         │
│                          │                     │
│  [🔍 Cari produk/SKU]   │  Item 1: Indomie x2 │
│                          │  Item 2: Aqua x1    │
│  [Semua][Makanan][Minuman│                     │
│  ][Snack][Rokok]         │  ─────────────────  │
│                          │  Subtotal: 11.000   │
│  ┌──┐ ┌──┐ ┌──┐         │  Diskon:   0        │
│  │🍜│ │💧│ │🍟│         │  PPN 11%:  1.210    │
│  │Rp│ │Rp│ │Rp│         │  ─────────────────  │
│  └──┘ └──┘ └──┘         │  TOTAL: Rp 12.210   │
│                          │                     │
│  ┌──┐ ┌──┐ ┌──┐         │  [Catatan order...] │
│  │  │ │  │ │  │         │                     │
│  └──┘ └──┘ └──┘         │  [💵 TUNAI]         │
│                          │  [📱 BAYAR DIGITAL] │
└──────────────────────────┴─────────────────────┘
```

#### Fitur Wajib:
- Search produk realtime (nama + SKU)
- Filter tab kategori
- Klik produk → tambah ke cart
- Qty +/- per item di cart
- Hapus item dari cart
- Subtotal + Tax 11% + Total
- Input catatan order
- Tombol TUNAI → modal kembalian
- Tombol BAYAR DIGITAL → Midtrans Snap
- Clear cart button

#### Fitur Bonus:
- Diskon per item (persen atau nominal)
- Diskon keseluruhan order
- Tipe order: Dine In / Take Away
- Split bill (bayar sebagian dulu)
- Hold order (simpan, kerjakan order lain)

#### Modal Struk Setelah Bayar:
```
┌────────────────────────┐
│   ✅ PEMBAYARAN SUKSES  │
│                        │
│   POS System           │
│   ──────────────────   │
│   Order: ORD-0001      │
│   Kasir: Budi          │
│   Tgl: 21 Mei 2026     │
│                        │
│   Indomie Goreng x2    │
│   Aqua 600ml    x1     │
│   ──────────────────   │
│   Subtotal: Rp 11.000  │
│   PPN 11%:  Rp  1.210  │
│   TOTAL:    Rp 12.210  │
│   Bayar:    Rp 15.000  │
│   Kembali:  Rp  2.790  │
│                        │
│   [🖨️ Print Struk]    │
│   [💬 WhatsApp]        │
│   [✕ Transaksi Baru]   │
└────────────────────────┘
```

---

### 2.2 🟢 MODUL DASHBOARD (Admin)

**Halaman: `/dashboard`**

#### Stat Cards (Baris 1):
| Card | Data | Warna |
|------|------|-------|
| Revenue Bulan Ini | SUM transactions | Kuning |
| Order Hari Ini | COUNT orders today | Hitam |
| Stok Kritis | COUNT stock ≤ alert | Oranye |
| Total Customer | COUNT users=customer | Hijau |

#### Charts:
- Line chart: penjualan 7 hari terakhir
- Bar chart: top 5 produk terlaris bulan ini
- Donut chart: metode pembayaran (QRIS vs Cash vs Transfer)

#### Alert Banner:
```
⚠️ 3 produk hampir habis stok! [Lihat Detail →]
```

#### Recent Transactions Table:
- 10 transaksi terbaru
- Badge: settlement=hijau, pending=kuning, cancelled=merah
- Klik row → detail order

#### Quick Actions:
- Tambah Produk
- Lihat Laporan
- Download PDF Hari Ini

---

### 2.3 🟢 MODUL PRODUK (Admin)

**Halaman: `/products`**

#### Tabel Produk:
| Kolom | Keterangan |
|-------|-----------|
| Foto | Thumbnail gambar |
| Nama + SKU | Bold nama, kecil SKU di bawah |
| Kategori | Badge kategori |
| Harga | Format Rp |
| Stok | Badge warna: hijau/oranye/merah |
| Status | Toggle aktif/nonaktif |
| Aksi | Edit ✏️ · Hapus 🗑️ |

#### Stok Badge Logic:
- `stock > stock_alert` → 🟢 Normal
- `0 < stock <= stock_alert` → 🟠 Menipis
- `stock === 0` → 🔴 Habis

#### Modal Tambah/Edit Produk:
```
Nama Produk      [________________]
SKU              [________________] (auto-generate opsional)
Kategori         [Pilih Kategori ▼]
Harga            [Rp _____________]
Stok Sekarang    [________________]
Batas Alert Stok [________________]
Deskripsi        [________________]
                 [________________]
Foto             [Upload / Drag & Drop]
                 [Preview foto]
Status           [● Aktif  ○ Nonaktif]

[Batal]          [Simpan Produk]
```

---

### 2.4 🟢 MODUL LAPORAN (Admin)

**Halaman: `/reports`**

#### Tab 1 — Laporan Penjualan:

**Filter:**
- Periode: Hari ini / 7 hari / 30 hari / Custom range
- Tampilan: Harian / Bulanan

**Summary Cards:**
- Total Revenue
- Total Transaksi
- Rata-rata Nilai Transaksi
- Produk Terjual (total qty)

**Chart:**
- Line chart revenue per periode

**Tabel Top Produk:**
- Rank, Nama, Qty Terjual, Revenue, % dari total

**Download:**
- [📄 Download PDF] [📊 Download Excel]

#### Tab 2 — Laporan Stok:

**Summary:**
- Total Produk Aktif
- Produk Stok Menipis
- Produk Stok Habis
- Total Nilai Stok (qty × harga)

**Tabel:**
- Produk, SKU, Kategori, Stok, Alert, Status, Nilai Stok

**Download:**
- [📄 Download PDF] [📊 Download Excel]

---

### 2.5 🟢 MODUL USER MANAGEMENT (Admin)

**Halaman: `/users`**

#### Tabel User:
- Avatar, Nama, Email, Role badge, Status, Aksi
- Filter: role, aktif/nonaktif
- Toggle aktif/nonaktif user
- Edit user (nama, email, role, password baru)
- Tambah user baru (admin set role)
- Tidak bisa hapus diri sendiri

---

### 2.6 🟡 MODUL MANAJEMEN SHIFT (Bonus)

**Inspired by Moka POS shift management**

#### Alur:
```
Kasir klik "Mulai Shift"
→ Input modal kas awal
→ Shift aktif tercatat (jam mulai, kasir, modal)

Selama shift: semua transaksi terhubung ke shift ini

Kasir klik "Tutup Shift"
→ Sistem hitung total penjualan shift ini
→ Tampil ringkasan: total transaksi, total tunai, total digital
→ Kasir konfirmasi
→ Laporan shift tersimpan
```

#### Data Shift:
```sql
shifts table:
- id
- user_id (kasir)
- modal_awal
- total_penjualan
- total_transaksi
- started_at
- ended_at
- status (active/closed)
```

---

### 2.7 🟡 MODUL LOYALTY PROGRAM (Bonus)

**Inspired by Moka POS loyalty**

#### Sistem Poin Sederhana:
- Setiap Rp 10.000 belanja = 1 poin
- 100 poin = diskon Rp 10.000
- Customer bisa lihat poin di profil mereka
- Kasir bisa redeem poin saat checkout

#### Implementasi Minimal:
- Kolom `loyalty_points` di tabel `users`
- Tambah poin setiap transaksi sukses
- Modal redeem poin di halaman kasir

---

### 2.8 🟡 MODUL DISKON & PROMO (Bonus)

**Inspired by Moka POS promo management**

#### Tipe Diskon:
```
1. Diskon Langsung per Item
   → Kasir input % atau nominal saat checkout
   → Butuh konfirmasi PIN admin kalau > 10%

2. Promo Otomatis (future)
   → Buy 2 Get 1
   → Diskon hari tertentu
   → Minimum pembelian
```

#### Implementasi Minimal:
- Input diskon di cart (persen atau nominal)
- Validasi: kasir max diskon 10%, admin unlimited
- Diskon tersimpan di order record

---

### 2.9 🔴 SKIP — Terlalu Kompleks untuk Timeline

Fitur-fitur ini ada di Moka POS tapi skip dulu:

| Fitur | Kenapa Skip |
|-------|-------------|
| Multi-cabang | Butuh arsitektur berbeda |
| Table management (F&B) | Butuh tabel layout builder |
| Kitchen display system | Butuh realtime WebSocket |
| Purchase order ke supplier | Butuh modul procurement |
| GoStore (toko online) | Butuh e-commerce module |
| Barcode scanner | Butuh hardware integration |
| Offline mode | Butuh service worker + IndexedDB |

---

## 3. AI ASSISTANT SIDEBAR — Upgrade dari PRD Sebelumnya

**Inspired by: modern POS analytics + Groq LLaMA 3.3**

### Layout Sidebar (280px, persistent kanan):
```
┌─────────────────────┐
│ 🤖 AI Assistant  ●  │  ← hijau = online
│ Groq LLaMA 3.3      │
├─────────────────────┤
│                     │
│  💬 Chat History    │
│                     │
│  ┌─────────────┐    │
│  │ AI: Halo!   │    │  ← bubble kiri (AI)
│  │ Ada yang    │    │
│  │ bisa saya   │    │
│  │ bantu?      │    │
│  └─────────────┘    │
│                     │
│       ┌──────────┐  │
│       │ User: Pr │  │  ← bubble kanan (user)
│       │ oduk apa │  │
│       │ terlaris?│  │
│       └──────────┘  │
│                     │
│  ┌─────────────┐    │
│  │ AI: Bulan   │    │
│  │ ini Indomie │    │
│  │ Goreng jadi │    │
│  │ #1 dengan   │    │
│  │ 45 terjual  │    │
│  └─────────────┘    │
│                     │
│  ⏱️ Mengetik...     │  ← typing indicator
│                     │
├─────────────────────┤
│ 💡 Quick Prompts:   │
│                     │
│ [Produk terlaris]   │
│ [Stok mau habis?]   │
│ [Rekomendasi jual]  │
├─────────────────────┤
│ [Ketik pertanyaan..]│
│               [➤]  │
├─────────────────────┤
│ 🔢 Token: 1,234     │  ← usage indicator
└─────────────────────┘
```

### 3 Tipe Query AI:
| Tombol | Endpoint | Contoh Jawaban AI |
|--------|----------|------------------|
| Produk terlaris | `/api/ai/query` | "Indomie Goreng jadi produk terlaris bulan ini dengan 45 unit terjual senilai Rp 157.500" |
| Stok mau habis? | `/api/ai/predict-stock` | "Aqua 600ml diperkirakan habis dalam 5 hari. Segera restok minimal 50 pcs" |
| Rekomendasi jual | `/api/ai/recommend` | "Pelanggan yang beli Indomie Goreng biasanya juga beli Sambal Sachet. Coba tawarkan bundling" |

---

## 4. STRUK TRANSAKSI

### Format Struk (Print + WhatsApp):
```
================================
        POS SYSTEM
      Toko Serba Ada
================================
Order  : ORD-20260521-0001
Kasir  : Budi Santoso
Tgl    : 21 Mei 2026, 14:30

--------------------------------
Indomie Goreng
  2 x Rp 3.500        Rp 7.000
Aqua 600ml
  1 x Rp 4.000        Rp 4.000
--------------------------------
Subtotal            Rp 11.000
PPN 11%              Rp 1.210
--------------------------------
TOTAL               Rp 12.210
--------------------------------
Bayar (QRIS)        Rp 12.210
================================
  Terima kasih sudah berbelanja!
      Sampai jumpa lagi 😊
================================
```

### Implementasi Struk:
- 🟢 Tampil di modal setelah transaksi sukses
- 🟢 Print via `window.print()` dengan CSS `@media print`
- 🟢 Kirim via WhatsApp (`wa.me/?text=...`)
- 🟡 Download PDF struk
- 🔴 Print ke thermal printer (butuh driver khusus)

---

## 5. URUTAN IMPLEMENTASI FRONTEND

Berdasarkan rubrik penilaian dan timeline yang tersisa:

### Minggu 1 (Prioritas Rubrik):
| Hari | Yang Dikerjakan |
|------|----------------|
| 1 | Setup Next.js + Tailwind + Zustand + Axios + Neo components |
| 2 | Auth (login/register) + protected routes + middleware |
| 3 | Dashboard page + stat cards + charts |
| 4 | Products page + CRUD modal |
| 5 | Categories page |

### Minggu 2 (Fitur Utama):
| Hari | Yang Dikerjakan |
|------|----------------|
| 6 | Kasir/POS page + cart logic |
| 7 | Payment flow + struk modal |
| 8 | AI Assistant sidebar |
| 9 | Orders + Reports page |
| 10 | Users page + Deploy ke Vercel |

### Bonus (kalau sempat):
- Shift management
- Loyalty points
- Diskon system

---

## 6. KOMPONEN NEOBRUTALISM YANG PERLU DIBUAT

```jsx
// NeoCard — card dasar
<div className="bg-white border-[2.5px] border-black shadow-neo p-4">

// NeoButton variants
<button className="bg-neo-yellow border-[2.5px] border-black 
  shadow-neo-sm font-bold px-4 py-2 
  hover:translate-x-[2px] hover:translate-y-[2px] 
  hover:shadow-none transition-all">

// NeoBadge
<span className="bg-green-100 border-[1.5px] border-green-600 
  text-green-700 font-bold text-xs px-2 py-1">

// NeoInput
<input className="border-[2.5px] border-black rounded-none 
  focus:outline-none focus:shadow-[3px_3px_0px_#FFE500] 
  font-medium px-3 py-2">

// NeoModal
<div className="fixed inset-0 bg-black/60 flex items-center justify-center">
  <div className="bg-white border-[2.5px] border-black 
    shadow-[6px_6px_0px_black] p-6 max-w-lg w-full mx-4">
```

---

## 7. ENVIRONMENT VARIABLES

```env
# API
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_APP_NAME=POS System

# Midtrans (isi setelah maintenance selesai)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=

# App Config
NEXT_PUBLIC_TAX_RATE=0.11
NEXT_PUBLIC_MAX_KASIR_DISCOUNT=10
```

---

*PRD ini mengadaptasi konsep Moka POS yang relevan dan realistis
untuk diimplementasikan dalam final project bootcamp individu.*
