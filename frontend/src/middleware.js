import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const raw   = request.cookies.get("token")?.value;
  const token = raw && raw !== "undefined" && raw !== "null" ? raw : null;

  const isPublic = PUBLIC_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname.startsWith(r)
  );

  // /dev/* requires login — but content access control handled by dev layout itself
  const isDev = pathname.startsWith("/dev");
  // /kasir requires login
  const isKasir = pathname === "/kasir";

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged-in users visiting public routes → redirect to dashboard
  if (token && isPublic && !isDev) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-touch-icon|og-image|images/).*)"],
};
