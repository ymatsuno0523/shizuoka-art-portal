"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { consumeAuthNext } from "@/lib/auth-next";
import { replaceAppHref } from "@/lib/tab-nav";

function oauthErrorMessage() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = query.get("error") || hash.get("error");
  if (code === "access_denied") return "Googleログインをキャンセルしました。";
  if (code || query.get("error_description") || hash.get("error_description")) {
    return "Googleログインに失敗しました。もう一度試してください。";
  }
  return null;
}

export default function AuthCallbackClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user) {
      replaceAppHref(router, consumeAuthNext());
      return;
    }

    const immediate = oauthErrorMessage();
    if (immediate) {
      setError(immediate);
      return;
    }

    const hasCode = searchParams.has("code") || window.location.hash.includes("access_token");
    if (!hasCode) {
      setError("Googleログインに失敗しました。もう一度試してください。");
      return;
    }

    const timer = window.setTimeout(() => {
      setError("Googleログインに失敗しました。もう一度試してください。");
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [loading, user, router, searchParams]);

  function goBack() {
    replaceAppHref(router, "/mypage");
  }

  if (error) {
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">ログイン</h1>
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={goBack}
          className="mt-6 rounded-xl border border-zinc-300 px-8 py-2.5 text-sm font-semibold dark:border-zinc-700"
        >
          戻る
        </button>
      </main>
    );
  }

  return (
    <main className="px-4 py-6">
      <p className="text-sm text-zinc-500">ログインしています...</p>
      <button
        type="button"
        onClick={goBack}
        className="mt-6 rounded-xl border border-zinc-300 px-8 py-2.5 text-sm font-semibold dark:border-zinc-700"
      >
        戻る
      </button>
    </main>
  );
}
