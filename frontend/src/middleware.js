// ============================================================
// middleware.js — Penjaga pintu rute (route guard)
//
// Analogi: Ini seperti "satpam gedung" —
// setiap kali seseorang mau masuk ke suatu ruangan (URL),
// satpam cek dulu: apakah punya kartu akses (token)?
// Kalau tidak punya kartu → arahkan ke pintu masuk (/login).
// Kalau sudah punya kartu tapi mau masuk pintu umum (/) → arahkan ke kantor (/dashboard).
//
// PENTING: Middleware ini berjalan di SERVER Next.js (Edge Runtime),
// BUKAN di browser. Karena itu dia tidak bisa baca localStorage.
// Dia baca token dari COOKIE (yang dikirim otomatis browser ke server).
//
// Alur token:
//   Browser login → authService simpan token ke localStorage + Cookie
//   Browser minta halaman baru → browser kirim Cookie ke Next.js server
//   Middleware baca Cookie → boleh masuk atau tidak
//
// Relasi:
//   - middleware.js ← membaca cookie "token" yang diset oleh authService.js
//   - authService.js → setTokenCookie() setiap login/register
//   - authService.js → clearTokenCookie() setiap logout
// ============================================================

import { NextResponse } from "next/server";

// Halaman yang bisa diakses TANPA login
// "/" = landing page, "/login" = form login, "/register" = form daftar
const PUBLIC_ROUTES = ["/", "/login", "/register"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Baca cookie "token" — ini yang diset saat login di authService.js
  const raw = request.cookies.get("token")?.value;
  // Sanitasi: anggap tidak ada token kalau nilainya "undefined" atau "null" (string)
  // Ini bisa terjadi kalau ada bug saat simpan token sebelumnya
  const token = raw && raw !== "undefined" && raw !== "null" ? raw : null;

  // Cek apakah halaman yang diminta adalah halaman publik
  // "/" perlu exact match, yang lain cukup startsWith (misal /login/reset tetap masuk PUBLIC)
  const isPublic = PUBLIC_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname.startsWith(r)
  );

  // /dev/* memerlukan login, tapi kontrol akses lebih detail
  // ditangani di dalam dev layout sendiri (bukan di sini)
  const isDev   = pathname.startsWith("/dev");
  // /kasir memerlukan login (kasir dan admin saja)
  const isKasir = pathname === "/kasir";

  // Kasus 1: tidak punya token DAN bukan halaman publik
  // → Paksa redirect ke /login
  // Contoh: user buka /dashboard langsung tanpa login → /login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Kasus 2: sudah punya token DAN minta halaman publik
  // → Redirect ke /dashboard (sudah login, tidak perlu login lagi)
  // Pengecualian: /dev tidak di-redirect (developer perlu akses dev tools)
  // Contoh: user sudah login tapi buka /login lagi → /dashboard
  if (token && isPublic && !isDev) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Kasus 3: kondisi normal → lanjutkan request
  return NextResponse.next();
}

// config.matcher: halaman mana saja yang diproses oleh middleware
// Kita SKIP file-file statis (gambar, CSS, JS bundle Next.js, favicon)
// karena tidak perlu pengecekan token untuk file-file itu
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|opengraph-image|apple-touch-icon|og-image|images/|sitemap.xml|robots.txt|web-app-manifest).*)"],
};
