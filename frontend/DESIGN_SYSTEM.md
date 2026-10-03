# Design System KasirAI

Gaya: **neobrutalism**. Border tebal, bayangan tanpa blur (hanya offset), sudut tegas (tanpa radius),
warna solid. Katalog visual semua komponen ada di `/dev/design-system` (khusus developer).

> Hasil audit desain issue #10 (P2). Kalau menambah komponen atau warna baru, perbarui file ini
> dan halaman katalog.

## 1. Warna

Satu sumber: `src/app/globals.css` (`:root`). Tailwind membaca token yang sama lewat
`tailwind.config.js`, jadi `bg-brand-black/50` (opacity) tetap bekerja.

| Token Tailwind | CSS variable | Hex | Dipakai untuk |
|---|---|---|---|
| `brand-yellow` | `--yellow` | `#FFE500` | CTA utama dalam aplikasi, penanda aktif, 1 highlight kata per section |
| `brand-black` | `--ink` | `#0A0A0A` | Teks, border, bayangan, tombol CTA di latar terang |
| `brand-cream` | `--cream` | `#FFFBEB` | Latar utama |
| `brand-gray` | `--gray` | `#F5F5F0` | Latar section alternatif |
| `success` | `--success` | `#00C27C` | Berhasil, lunas, aman |
| `danger` | `--danger` | `#FF3B3B` | Error, bahaya, hapus |
| `warning` | `--warning` | `#FF9F1C` | Peringatan, stok menipis |
| `info` | `--info` | `#0066FF` | Informasi netral |
| `accent` | `--accent` | `#8B5CF6` | Aksen sekunder (dekorasi, grafik) |

Aturan:
- **Jangan menulis hex** di komponen. Pakai class (`bg-success`) atau variabel CSS di style inline
  (`boxShadow: "4px 4px 0 var(--ink)"`). Jangan pakai palet bawaan Tailwind (`bg-green-100`, `text-red-600`).
- Pengecualian hex mentah: grafik Recharts, logo SVG, dan HTML struk cetak (konteks tanpa CSS variable).
- **Aturan kuning:** kuning menandai "aksi utama" atau "sedang aktif". Jangan dipakai untuk dekorasi
  (kotak ikon, kartu biasa), jangan dipakai bersama tombol kuning di atas latar kuning (pakai tombol hitam),
  dan maksimal satu kata ber-highlight kuning per section.
- Teks di atas latar tint (mis. `bg-success/15`) memakai teks hitam agar kontras lolos WCAG AA (4,5:1).

## 2. Tipografi

| Class | Ukuran | Dipakai untuk |
|---|---|---|
| `text-display` | 36 sampai 54 px | Judul hero dan CTA besar |
| `text-h1` | 24 sampai 32 px | Judul halaman aplikasi |
| `text-h2` | 32 sampai 48 px | Judul section landing |
| `text-h3` | 24 px | Judul kartu besar |
| `text-h4` | 18 px | Judul kartu kecil |
| `text-body` / `text-small` / `text-caption` | 16 / 14 / 12 px | Teks isi, pendukung, keterangan |

- **Space Grotesk** (`font-grotesk`) untuk judul, **Inter** untuk isi, **JetBrains Mono** (`font-mono`)
  **hanya untuk angka, harga, dan kode**. Label, chip, dan kalimat tidak memakai mono.
- Jangan pakai `text-4xl`/`text-5xl` untuk judul section; pakai token di atas (sudah responsif).
- Panjang baris teks isi maksimal sekitar 65 karakter.

## 3. Komponen

- **Tombol:** `components/ui/NeoButton.jsx`. Varian `cta` (utama, latar terang), `inverse` (utama, latar gelap),
  `primary` (aksi utama dalam aplikasi), `secondary`, `dark`, `outlineLight`, `ghost`, `danger`.
  Ukuran `sm | md | lg | xl`. Untuk `<Link>` pakai `neoButtonClass({ variant, size })`.
  **Satu tombol utama per layar.** `danger` hanya untuk aksi merusak.
- **Kartu:** `components/ui/NeoCard.jsx`. Varian `default | highlight | dark`, ukuran `md` (dashboard) dan `lg` (landing).
- **Badge:** `components/ui/NeoBadge.jsx`. Gunakan nama semantik (`success`, `danger`, `warning`, `info`).
- **Modal:** `NeoModal`; tawaran upgrade memakai `UpgradeModal` lewat `useUpgradeModalStore`.
- Fokus keyboard harus terlihat di semua elemen interaktif (`focus-visible:outline`); sudah bawaan `NeoButton`.

## 4. Spasi dan tata letak

- Skala 4 px (kelipatan `1` Tailwind = 4 px). Jarak antar-section landing `py-20`; kartu dalam grid `gap-5` atau `gap-6`.
- Bayangan: `2px` (elemen kecil), `4px` (kartu), `6px` (kartu landing), `8px` (modal / sorotan).
- Section yang punya anchor (`#fitur`, `#harga`, ...) wajib `scroll-mt-28` agar tidak tertutup navbar.
- Lebar konten landing `max-w-6xl`/`max-w-7xl` dengan gutter `px-4 sm:px-6`.

## 5. Ikon

- Hanya **Lucide React** (jangan tambah library ikon lain). `strokeWidth={2.5}` agar serasi dengan border tebal.
- Ukuran: 13 sampai 16 px di tombol kecil, 20 sampai 26 px di kotak ikon. Ikon dekoratif diberi `aria-hidden`.
- Kotak ikon hanya dipakai kalau ikon membawa makna; jangan mengulang judul di sebelahnya dengan chip label.

## 6. Menambah atau mengubah token

1. Ubah nilai di `:root` `src/app/globals.css` (triplet `--x-rgb` dan versi penuhnya).
2. Kalau token baru, daftarkan di `tailwind.config.js` (`colors`) memakai `rgb(var(--x-rgb) / <alpha-value>)`.
3. Tambahkan ke tabel di atas dan ke `/dev/design-system`.
