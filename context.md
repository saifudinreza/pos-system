# context.md

Alur kerja setiap kali Saifudin memberi prompt / memulai tugas baru di repo ini. Claude wajib mengikuti urutan ini.

## Alur Wajib

1. **Mulai dari Plan Mode.** Jangan langsung menulis code. Riset dulu (baca file terkait, `PROGRESS.md`, `CLAUDE.md`), lalu susun rencana.
2. **Jelaskan alurnya dulu ke user** sebelum mengerjakan apa pun. Tujuannya: user paham alur dan code yang nanti dibuat.
   - Pakai bahasa Indonesia yang sederhana.
   - Pakai **analogi sehari-hari** (misal: "Global Scope itu seperti satpam yang otomatis cek KTP tenant di setiap pintu").
   - Sebutkan: apa yang akan diubah, file mana, urutan langkahnya, dan kenapa begitu.
3. **Berikan best practice** yang relevan (keamanan, isolasi tenant, performa, testing, kesesuaian dengan pola yang sudah ada di proyek), plus trade-off singkat kalau ada pilihan.
4. **Tunggu persetujuan user** atas rencana tersebut.
5. **Baru kerjakan code-nya.** Setelah selesai: jalankan test yang relevan, lalu update `PROGRESS.md`.

## Format Penjelasan Rencana

- **Gambaran singkat**: apa tujuannya, dalam 1-2 kalimat.
- **Analogi**: satu analogi yang mudah dibayangkan.
- **Langkah-langkah**: daftar bernomor, tiap langkah menyebut file yang disentuh.
- **Best practice**: poin-poin yang dipakai dan alasannya.
- **Risiko**: hal yang bisa rusak (ingat: proyek ini production, Midtrans uang asli).

## Catatan

- Teks user-facing (label UI, pesan error) tetap Bahasa Indonesia.
- Untuk perubahan sangat kecil (typo, ganti teks), rencana boleh sangat singkat, tapi urutannya tetap: jelaskan dulu, baru kerjakan.
