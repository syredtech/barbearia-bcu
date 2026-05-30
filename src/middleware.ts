import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/painel")) {
      if (token?.role !== "owner") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    if (pathname.startsWith("/admin")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (pathname.startsWith("/api/owner/")) {
      if (token?.role !== "owner") {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
      }
    }

    if (pathname.startsWith("/api/admin/")) {
      if (token?.role !== "admin") {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname.startsWith("/api/owner/") || pathname.startsWith("/api/admin/")) {
          return !!token;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/painel/:path*", "/admin/:path*", "/minha-conta/:path*", "/api/owner/:path*", "/api/admin/:path*"],
};
