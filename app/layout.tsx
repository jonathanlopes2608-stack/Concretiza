import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { brandingCssVars, getBranding } from "@/src/config/branding";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const brand = getBranding();

export const metadata: Metadata = {
  title: `${brand.name} — Conformidade`,
  description:
    brand.slogan ||
    "Fila de produção de conformidade de financiamento imobiliário",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cssVars = brandingCssVars(brand) as CSSProperties;
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={cssVars}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
