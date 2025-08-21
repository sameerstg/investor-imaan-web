// or for NextAuth v4.29+:
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Custom middleware for protecting routes
export function middleware(req: NextRequest) {
  const token = req.cookies.get("next-auth.session-token") || req.cookies.get("__Secure-next-auth.session-token");

  // If no token, redirect to sign-in
  if (!token) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // If token exists, continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico|sign-in).*)"],
};
