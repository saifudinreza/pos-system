// ============================================================
// sitemap.js — Peta situs (XML sitemap) untuk SEO
//
// Next.js file convention: menghasilkan /sitemap.xml otomatis
// dari array di bawah. Hanya halaman PUBLIK yang didaftarkan
// (landing, login, register) — halaman dashboard bersifat privat
// dan sudah di-block di robots.txt.
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sikasirai.com";

export default function sitemap() {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
