// ============================================================
// contact.js, Satu sumber data kontak untuk landing page & halaman legal.
// Ganti di sini saja kalau alamat email / nomor WhatsApp berubah.
//
// Email saat ini: kotak masuk dukungan sikasirai0@gmail.com. Kalau nanti ada
// alamat domain resmi
// (mis. halo@sikasirai.com), ganti di sini dan di env SUPPORT_EMAIL backend.
// ============================================================

export const CONTACT = {
  email:     "sikasirai0@gmail.com",
  whatsapp:  "6281294508057", // format 62xxx tanpa tanda +
  instagram: "https://instagram.com/zareddicted_",
};

/** Tautan WhatsApp dengan pesan awal opsional. */
export const waLink = (text) =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
