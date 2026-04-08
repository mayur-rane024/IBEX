import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import Header from "@/app/_components/Header";
import UserRecordSync from "@/app/_components/UserRecordSync";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "IBEX",
  description: "Anonymous AI learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} font-sans`}>
          <UserRecordSync />
          <div className="relative min-h-screen">
            <Header />
            {children}
            <Toaster position="top-center" richColors />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
