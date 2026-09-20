import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/app/components/AuthProvider";
import BottomNav from "@/app/components/BottomNav";
import Header from "@/app/components/Header";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
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
      className={`${notoSansJp.className} ${notoSansJp.variable} h-full antialiased`}
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
