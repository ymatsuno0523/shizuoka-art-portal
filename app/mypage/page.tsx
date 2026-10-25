import type { Metadata } from "next";
import { Suspense } from "react";
import MyPageClient from "./MyPageClient";

export const metadata: Metadata = {
  title: "マイページ",
};

export default function MyPage() {
  return (
    <Suspense
      fallback={
        <main className="px-4 py-6">
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </main>
      }
    >
      <MyPageClient />
    </Suspense>
  );
}
