import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TravelSplit - 旅行費用分攤追蹤器",
  description: "記錄旅行開銷，輕鬆結算分攤。TravelSplit 幫你輕鬆管理旅行費用，與朋友公平分帳。",
  keywords: ["旅行", "費用分攤", "記帳", "旅行開銷", "分帳", "TravelSplit", "trip", "expense", "split"],
  authors: [{ name: "TravelSplit Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "TravelSplit - 旅行費用分攤追蹤器",
    description: "記錄旅行開銷，輕鬆結算分攤",
    url: "https://travel-split-pi.vercel.app/",
    siteName: "TravelSplit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TravelSplit - 旅行費用分攤追蹤器",
    description: "記錄旅行開銷，輕鬆結算分攤",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
