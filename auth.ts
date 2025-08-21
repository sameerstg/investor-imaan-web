import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma } from "@prisma/client";
export const { handlers, signIn, signOut, auth } = NextAuth({
//   adapter: PrismaAdapter(Prisma),

  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
//   callbacks: {
//     async signIn({ account, profile }) {
//       if (!profile?.email) {
//         throw new Error("Email is required for sign-in");
//       }
//       await prisma?.user.upsert({
//         where: { email: profile?.email },
//         create: {
//           email: profile.email,
//           name: profile.name,
//         },
//         update: {
//           name: profile.name,
//         },
//       });
//       return true;
//     },
//   },
  debug: true,
});
