# CREDITS, lisensi aset video KasirAI

Catatan lisensi semua komponen yang dipakai di video demo. **Perbarui file ini setiap kali
mengganti narasi, musik, atau efek suara.**

## Remotion

- Paket: `remotion` dan `@remotion/*` versi **4.0.532** (dipin tanpa `^`).
- Lisensi: https://remotion.dev/license (dicek pada **3 Oktober 2026**).
- Kesimpulan: **Free License** berlaku untuk individu, perusahaan for-profit dengan maksimal
  3 karyawan, dan organisasi nirlaba, termasuk untuk penggunaan komersial. KasirAI dikerjakan
  solo oleh pemilik, jadi memenuhi syarat.
- **Cek ulang syaratnya sebelum tim bertambah lebih dari 3 orang.** Dokumen lisensi menyebut
  bahwa ketentuan akan sedikit berubah di Remotion 5.0.

## Font

| Font | Sumber | Lisensi |
|---|---|---|
| Space Grotesk | Google Fonts (`@remotion/google-fonts/SpaceGrotesk`) | SIL Open Font License 1.1 |
| JetBrains Mono | Google Fonts (`@remotion/google-fonts/JetBrainsMono`) | SIL Open Font License 1.1 |

Keduanya sama dengan font yang dipakai aplikasi (`frontend/tailwind.config.js`).

## Logo dan gambar

- `public/logo/logo-primary.png`, `public/logo/logo-icon.png`: milik KasirAI,
  disalin dari `frontend/public/logo/`.
- Emoji pada kartu produk dirender oleh font emoji sistem tempat video dirender.
- Maskot kura-kura **tidak dipakai** (lisensi sumber belum jelas, lihat pertanyaan ke owner di issue #7).

## Musik latar dan sound effect

**Semuanya dibuat sendiri lewat sintesis** oleh `scripts/gen-audio.mjs` (gelombang sinus,
kotak, dan noise dari nol). Tidak ada sampel atau rekaman pihak ketiga, jadi tidak ada
lisensi pihak ketiga dan tidak perlu atribusi.

| File | Isi | Sumber | Lisensi |
|---|---|---|---|
| `public/audio/music/bgm.wav` | Musik latar instrumental, 120 BPM, progresi C-Am-F-G | `scripts/gen-audio.mjs` | Karya sendiri (milik pemilik repo) |
| `public/audio/sfx/pop.wav` | Pop pendek | `scripts/gen-audio.mjs` | Karya sendiri |
| `public/audio/sfx/thump.wav` | Thump saat kartu mendarat | `scripts/gen-audio.mjs` | Karya sendiri |
| `public/audio/sfx/whoosh.wav` | Whoosh transisi | `scripts/gen-audio.mjs` | Karya sendiri |
| `public/audio/sfx/click.wav` | Klik tombol | `scripts/gen-audio.mjs` | Karya sendiri |
| `public/audio/sfx/tick.wav` | Ketukan tunggal | `scripts/gen-audio.mjs` | Karya sendiri |
| `public/audio/sfx/typing.wav` | Ketikan keyboard | `scripts/gen-audio.mjs` | Karya sendiri |
| `public/audio/sfx/chaching.wav` | Mesin kasir saat lunas | `scripts/gen-audio.mjs` | Karya sendiri |
| `public/audio/sfx/ding.wav` | Notifikasi (bukan suara notifikasi WhatsApp) | `scripts/gen-audio.mjs` | Karya sendiri |
| `public/audio/sfx/buzz.wav` | Buzz pada tanda silang | `scripts/gen-audio.mjs` | Karya sendiri |
| `public/audio/sfx/chime.wav` | Chime sukses | `scripts/gen-audio.mjs` | Karya sendiri |

Folder `public/audio/` tidak di-commit (di-`.gitignore`). Buat ulang dengan `npm run audio`.

## Suara narasi

> **STATUS: PLACEHOLDER INTERNAL. BELUM LAYAK UNTUK PUBLIKASI.**

- File: `public/audio/vo/vo-s1.mp3` sampai `vo-s8.mp3`, dibuat oleh `scripts/gen-vo.mjs`.
- Sumber: suara neural `id-ID-GadisNeural` lewat paket npm `msedge-tts`, yang memakai layanan
  Read Aloud milik Microsoft Edge. **Ini jalur tidak resmi.** Syarat penggunaan komersialnya
  tidak jelas dan bisa berhenti bekerja kapan saja.
- **Wajib diganti sebelum video dipublikasikan** dengan salah satu dari:
  1. rekaman suara manusia (owner atau orang lain, dengan izin tertulis), atau
  2. layanan TTS berbayar yang jelas mengizinkan penggunaan komersial (catat nama layanan,
     paket, dan tanggal syarat dicek di sini).
- Setelah mengganti file narasi, jalankan ulang penentuan waktu kalimat (lihat `README.md`,
  bagian "Mengganti narasi").

## Data demo

Semua nama, email, nomor telepon, dan angka di video adalah **fiktif** (toko "Kopi Senja",
kasir "Rina"). Tidak ada data tenant, pelanggan, key, atau URL backend yang asli.
Pola QR di layar hanyalah gambar contoh, bukan kode QR yang bisa dipindai.
