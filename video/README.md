# Video Demo KasirAI (Remotion)

Project video marketing KasirAI: intro, problem, solution (demo login, kasir, transaksi,
laporan), dan outro. Hasil: `out/sikasirai-demo.mp4` (H.264, 1920x1080, 30 fps, ±2:15).

Folder ini terpisah dari `frontend/` dan `backend/`, dengan `package.json` sendiri, supaya
dependency Remotion tidak ikut ke build Vercel. Rencana lengkapnya ada di issue #7.

## Menjalankan

Butuh Node.js 20 atau lebih baru (dicoba di Node 24).

```bash
cd video
npm install
npm run prepare-audio   # buat musik, sound effect, dan narasi placeholder (butuh internet)
npm run studio          # pratinjau di browser
npm run render          # hasil: out/sikasirai-demo.mp4
```

| Perintah | Fungsi |
|---|---|
| `npm run studio` | Remotion Studio, untuk melihat dan menggeser timeline |
| `npm run audio` | Membuat `bgm.wav` dan semua sound effect (sintesis, tanpa internet) |
| `npm run vo` | Membuat narasi placeholder (TTS) dan `src/data/vo-timing.json` |
| `npm run render` | Render final 1080p |
| `npm run render:draft` | Render draf 720p (lebih cepat) untuk direview |
| `node scripts/stills.mjs 120 960` | Render frame tertentu ke `out/stills/` untuk dicek tampilannya |

File hasil render (`out/`, `*.mp4`) dan audio (`public/audio/`) tidak di-commit.
Render pertama mengunduh Chrome Headless Shell (±115 MB).

## Struktur

```
src/
  Root.tsx              Composition + durasi tiap scene dari panjang narasi
  KasirAIDemo.tsx     Menyusun 8 scene + musik latar (volume turun saat narasi)
  theme.ts              Token warna/font/shadow neobrutalism (dari frontend/tailwind.config.js)
  timing.ts             Durasi scene + sinkronisasi dengan kalimat narasi
  data/demo.ts          Data fiktif toko "Kopi Senja" (satu sumber untuk semua scene)
  data/narration.json   Naskah narasi per scene
  data/vo-timing.json   Waktu mulai tiap kalimat (dibuat otomatis oleh `npm run vo`)
  components/           NeoCard, NeoButton, Cursor, Captions, Wipe, AppWindow, tiruan UI aplikasi
  scenes/               S1 Intro ... S8 Outro, satu file per scene
scripts/                gen-audio.mjs, gen-vo.mjs, stills.mjs
```

## Alur video

| Scene | Isi | Kira-kira |
|---|---|---|
| S1 | Logo mendarat, tagline | 0:00 |
| S2 | Masalah toko manual (4 kartu, ditandai silang) | 0:12 |
| S3 | Solusi: laptop + HP | 0:33 |
| S4 | Demo login | 0:44 |
| S5 | Buka shift, pilih produk ke keranjang | 0:58 |
| S6 | Bayar tunai, QRIS, struk ke WhatsApp | 1:16 |
| S7 | Dashboard, laporan laba kotor, export, asisten AI | 1:36 |
| S8 | Manfaat, harga paket, ajakan coba gratis | 2:01 |

Layar aplikasi **dibuat ulang sebagai komponen React**, bukan rekaman layar. Jadi tajam di
1080p, tidak membocorkan data asli, dan tidak perlu menjalankan Midtrans production.

## Mengganti narasi

1. Ubah teks di `src/data/narration.json`.
2. `npm run vo` membuat ulang audio placeholder **dan** `vo-timing.json`.
3. Kalau memakai rekaman suara sendiri: taruh sebagai `public/audio/vo/vo-s1.mp3` ... `vo-s8.mp3`
   (satu file per scene), lalu perbarui `src/data/vo-timing.json` dengan waktu mulai dan selesai
   tiap kalimat (detik) supaya animasi dan caption tetap pas. Durasi scene otomatis mengikuti
   panjang file.
4. Perbarui `CREDITS.md`.

## Hal yang perlu dicek sebelum dipublikasikan

- Narasi masih **placeholder**, lihat `CREDITS.md`.
- Harga paket di scene S8 mengikuti `SubscriptionController::PRICES` (Pro Rp 129.000/bulan,
  Enterprise Rp 499.000/bulan). Cek ulang kalau harga berubah.
- Nama merek diputuskan **KasirAI** (domain tetap sikasirai.com). Suara narasi hasil rekaman lama
  masih menyebut "Si Kasir A I"; rekam ulang narasi lalu render ulang video sebelum dipublikasikan.
