// ============================================================
// middleware.js, Penjaga pintu rute (route guard)
//
// Analogi: Ini seperti "satpam gedung",
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
// KHUSUS /dev/* (Developer Portal): selain punya token, PERAN user diverifikasi
// ke backend (GET /me) di sini, di server. Peran TIDAK dibaca dari cookie atau
// localStorage karena keduanya bisa diubah user. Hasil bukan "developer",
// backend tidak menjawab, atau timeout → ditolak (fail closed). Selain itu
// semua endpoint API /dev/* tetap dikunci role:developer di backend.
//
// Relasi:
//   - middleware.js ← membaca cookie "token" yang diset oleh authService.js
//   - authService.js → setTokenCookie() setiap login/register
//   - authService.js → clearTokenCookie() setiap logout
// ============================================================

import { NextResponse } from "next/server";

// Halaman yang bisa diakses TANPA login
// "/" = landing page, "/login" = form login, "/register" = form daftar,
// "/forgot-password" = lupa password (minta kode OTP lalu ganti password)
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

// Halaman hukum: bisa dibuka SIAPA PUN, termasuk yang sudah login
// (tidak di-redirect ke /dashboard seperti PUBLIC_ROUTES lainnya)
const OPEN_ROUTES = ["/kebijakan-privasi", "/syarat-ketentuan"];

// Alamat API (di-inline Next.js saat build dari NEXT_PUBLIC_API_URL, mis. https://x.onrender.com/api)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * isDeveloper, tanya backend siapa pemilik token ini (GET /me), lalu cek
 * role === "developer" dan akun aktif. Tidak pernah melempar error:
 * semua kegagalan dianggap "bukan developer".
 */
async function isDeveloper(token) {
  if (!API_URL) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000); // cold start Render bisa lambat
  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const body = await res.json();
    const user = body?.data ?? body?.user ?? body;
    return user?.role === "developer" && user?.is_active !== false;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Baca cookie "token", ini yang diset saat login di authService.js
  const raw = request.cookies.get("token")?.value;
  // Sanitasi: anggap tidak ada token kalau nilainya "undefined" atau "null" (string)
  // Ini bisa terjadi kalau ada bug saat simpan token sebelumnya
  const token = raw && raw !== "undefined" && raw !== "null" ? raw : null;

  // Halaman hukum selalu lolos tanpa pengecekan token
  if (OPEN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next();
  }

  // Cek apakah halaman yang diminta adalah halaman publik
  // "/" perlu exact match, yang lain cukup startsWith (misal /login/reset tetap masuk PUBLIC)
  const isPublic = PUBLIC_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname.startsWith(r)
  );

  // /dev/* = Developer Portal: wajib login DAN berperan developer (diverifikasi ke backend)
  const isDev   = pathname === "/dev" || pathname.startsWith("/dev/");
  // /kasir memerlukan login (kasir dan admin saja)
  const isKasir = pathname === "/kasir";

  // Kasus 1: tidak punya token DAN bukan halaman publik
  // → Paksa redirect ke /login
  // Contoh: user buka /dashboard langsung tanpa login → /login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Kasus 1b: /dev/* hanya untuk akun berperan developer.
  // Non-developer dialihkan ke /dashboard (bukan ke halaman yang membocorkan adanya portal).
  if (isDev && !(await isDeveloper(token))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Kasus 2: sudah punya token DAN minta halaman publik
  // → Redirect ke /dashboard (sudah login, tidak perlu login lagi)
  // (/dev bukan halaman publik; dijaga di Kasus 1b)
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
//
//  JANGAN HAPUS exclusions di bawah ini (sitemap.xml, robots.txt,
// icon.svg, apple-icon.png, opengraph-image, manifest.webmanifest,
// favicon.ico, dll), itu file konvensi Next.js yang dipanggil crawler /
// social-share bot TANPA cookie token. Kalau ada satu saja yang tidak
// di-exclude, bot di-redirect ke /login dan SEO/preview rusak (sudah
// pernah terjadi 3×, lihat CLAUDE.md bagian "Gotcha Next.js / Vercel").
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|opengraph-image|apple-touch-icon|og-image|images/|landing/|sitemap.xml|robots.txt|web-app-manifest).*)"],
};
