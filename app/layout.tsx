import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProviderGateServer } from "@/components/providers/AuthProviderGate.server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Commerce App",
  description: "E-Commerce App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProviderGateServer>{children}</AuthProviderGateServer>
      </body>
    </html>
  );
}
