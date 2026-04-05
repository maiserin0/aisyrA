import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import { Space_Grotesk, Unbounded } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "aisyrA",
  description: "Synchronized modern streaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${unbounded.variable} min-h-screen antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
