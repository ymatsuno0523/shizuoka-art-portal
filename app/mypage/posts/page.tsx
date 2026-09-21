import { Suspense } from "react";
import PostsClient from "./PostsClient";

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
