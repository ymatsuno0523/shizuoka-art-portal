import type { Metadata } from "next";
import { Suspense } from "react";
import PostsClient from "./PostsClient";

export const metadata: Metadata = {
  title: "投稿一覧",
};

export default function PostsPage() {
  return (
    <Suspense
      fallback={
        <main className="px-4 py-6">
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </main>
      }
    >
      <PostsClient />
    </Suspense>
  );
}
