import { NextResponse } from "next/server";

// Rute publik yang bisa diakses tanpa login
// "/" = landing page, "/login" = halaman masuk, "/register" = halaman daftar
const PUBLIC_ROUTES = ["/", "/login", "/register"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
