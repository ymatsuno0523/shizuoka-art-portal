import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/app/components/AuthProvider";
import BottomNav from "@/app/components/BottomNav";
import Header from "@/app/components/Header";
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
  title: "Shizuoka Art Portal",
  description: "静岡県内のアート・イラスト情報",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-200 dark:bg-zinc-950">
        <AuthProvider>
          <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background shadow-xl">
            <Header />
            <div className="flex-1 pb-20">{children}</div>
            <Suspense fallback={<div className="h-16" />}>
              <BottomNav />
            </Suspense>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
