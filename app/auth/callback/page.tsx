import { Suspense } from "react";
import Link from "next/link";
import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="px-4 py-6">
          <p className="text-sm text-zinc-500">ログインしています...</p>
          <Link
            href="/mypage"
            className="mt-6 inline-block rounded-xl border border-zinc-300 px-8 py-2.5 text-sm font-semibold dark:border-zinc-700"
          >
            戻る
          </Link>
        </main>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
