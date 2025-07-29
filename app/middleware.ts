// // middleware.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { withAuth } from "next-auth/middleware";
// import { authOptions } from "@/lib/auth"; // Adjust the path if necessary
// import { getServerSession } from "next-auth"; // Import getServerSession

// // Middleware configuration to match all routes
// export const config = {
//   matcher: ["/(.*)"], // This matches all routes
// };

// export default withAuth(
//   async function middleware(req: NextRequest) {
//     // Get the session from NextAuth using getServerSession
//     const session = await getServerSession(req, authOptions); // Use NextAuth's getServerSession function

//     // If no session exists, redirect to sign-in page
//     if (!session) {
//       const signInUrl = new URL("/sign-in", req.url);
//       return NextResponse.redirect(signInUrl);
//     }

//     // Allow the request to proceed if authenticated
//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       // Ensure the middleware runs only if the user is authenticated
//       authorized: ({ token }) => !!token,
//     },
//   }
// );
