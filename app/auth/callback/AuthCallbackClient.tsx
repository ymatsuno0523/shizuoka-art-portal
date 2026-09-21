"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { consumeAuthNext } from "@/lib/auth-next";

export default function AuthCallbackClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(consumeAuthNext());
      return;
    }
    const oauthError =
      searchParams.get("error_description") || searchParams.get("error");
    if (oauthError) {
      setError(
        oauthError === "access_denied"
          ? "Googleログインをキャンセルしました。"
          : oauthError,
      );
      return;
    }
    setError("Googleログインに失敗しました。もう一度試してください。");
  }, [loading, user, router, searchParams]);

  if (error) {
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">ログイン</h1>
        <p className="text-sm text-red-600">{error}</p>
        <p className="mt-4">
          <Link href="/mypage" className="text-sm font-semibold underline">
            マイページへ戻る
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="px-4 py-6">
      <p className="text-sm text-zinc-500">ログインしています...</p>
    </main>
  );
}
