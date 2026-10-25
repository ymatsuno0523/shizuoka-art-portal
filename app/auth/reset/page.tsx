import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "パスワード再設定",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="px-4 py-6">
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </main>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
