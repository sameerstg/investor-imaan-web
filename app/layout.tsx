import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/AuthProvider";

// Temporarily disable Google Fonts to fix Vercel deployment issue
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Investor Imaan - Shariah Compliant Portfolio Tracker",
  description: "Track your investments with Shariah compliance in mind",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider>
        <body className="antialiased">
          <ThemeProvider attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
            <Navbar />

            {children}

          </ThemeProvider>

        </body>
      </AuthProvider>
    </html>
  );
}
