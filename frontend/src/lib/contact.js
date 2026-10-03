// ============================================================
// contact.js, Satu sumber data kontak untuk landing page & halaman legal.
// Ganti di sini saja kalau alamat email / nomor WhatsApp berubah.
//
// TODO owner (issue #10, P0-9): ganti email ke alamat domain resmi
// (mis. halo@sikasirai.com) setelah kotak masuknya siap menerima email.
// ============================================================

export const CONTACT = {
  email:     "donojomi@gmail.com",
  whatsapp:  "6281294508057", // format 62xxx tanpa tanda +
  instagram: "https://instagram.com/zareddicted_",
};

/** Tautan WhatsApp dengan pesan awal opsional. */
export const waLink = (text) =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
