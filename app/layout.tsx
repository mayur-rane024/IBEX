import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import Header from "@/app/_components/Header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "IBEX",
  description: "AI-powered learning platform backend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans">
          <div className="max-w-7xl mx-auto">
            <Header />
            {children}
            <Toaster position="top-center" richColors />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
