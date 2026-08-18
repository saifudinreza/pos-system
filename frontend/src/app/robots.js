// ============================================================
// robots.js — Aturan crawling untuk search engine (/robots.txt)
//
// Halaman publik diizinkan (landing, login, register), sedangkan
// semua halaman privat dashboard di-block supaya tidak muncul di
// hasil pencarian. Referensi sitemap diarahkan ke /sitemap.xml.
//
// ⚠️ Kalau ada route publik baru yang harus ter-index, tambahkan
// di allow — dan jangan lupa daftarkan juga di sitemap.js.
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sikasirai.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: [
        "/dashboard",
        "/kasir",
        "/products",
        "/categories",
        "/orders",
        "/transactions",
        "/reports",
        "/users",
        "/profile",
        "/upgrade",
        "/ai-monitoring",
        "/dev",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
