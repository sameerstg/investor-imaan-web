// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    // ✅ `req.nextauth.token` is typed as `JWT | null`
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // ✅ explicit typing here fixes TS errors
      authorized: ({ token }: { token: unknown }) => {
        return !!token; // only allow if token exists
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next|static|favicon.ico|sign-in).*)"], 
  // ✅ exclude /sign-in from protection
};
