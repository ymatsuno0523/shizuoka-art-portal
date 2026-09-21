"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

export default function ResetPasswordClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setError(null);
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください。");
      return;
    }
    if (password !== confirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }
    setBusy(true);
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/mypage");
  }

  if (loading) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">パスワード再設定</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          リンクが無効か、期限切れです。マイページからもう一度メールを送ってください。
        </p>
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
      <h1 className="mb-4 text-lg font-bold">パスワード再設定</h1>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <label className="block text-sm">
          新しいパスワード（6文字以上）
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-sm">
          パスワード（確認）
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          変更する
        </button>
      </form>
    </main>
  );
}
