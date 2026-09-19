"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { formatEventDate, type EventRow } from "@/lib/events";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

export default function MyPageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    const supabase = createBrowserSupabase();
    supabase
      .from("events")
      .select("*")
      .eq("created_by", user.id)
      .order("start_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setListError(error.message);
          return;
        }
        setListError(null);
        setEvents((data ?? []) as EventRow[]);
      });
  }, [user]);

  function redirectAfterLogin() {
    if (nextPath && nextPath.startsWith("/")) {
      router.push(nextPath);
      return;
    }
    router.refresh();
  }

  async function handleSignIn() {
    setAuthError(null);
    setAuthMessage(null);
    if (!email || password.length < 6) {
      setAuthError("メールと6文字以上のパスワードを入力してください。");
      return;
    }
    setAuthBusy(true);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    redirectAfterLogin();
  }

  async function handleSignUp() {
    setAuthError(null);
    setAuthMessage(null);
    if (!email || password.length < 6) {
      setAuthError("メールと6文字以上のパスワードを入力してください。");
      return;
    }
    setAuthBusy(true);
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setAuthBusy(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    if (!data.session) {
      setAuthMessage(
        "確認メールを送りました。メールのリンクを開いてからログインしてください。開発中は Supabase の Confirm email をオフにするとすぐ入れます。",
      );
      return;
    }
    redirectAfterLogin();
  }

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
  }

  async function handleDelete(id: string) {
    if (!confirm("このイベントを削除しますか？")) return;
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      setListError(error.message);
      return;
    }
    setEvents((current) => current.filter((item) => item.id !== id));
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
        <h1 className="mb-4 text-lg font-bold">マイページ</h1>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          ログインするとイベントを投稿・削除できます。
        </p>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSignIn();
          }}
        >
          <label className="block text-sm">
            メール
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="block text-sm">
            パスワード（6文字以上）
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
          {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
          {authMessage ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{authMessage}</p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={authBusy}
              onClick={handleSignIn}
              className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              ログイン
            </button>
            <button
              type="button"
              disabled={authBusy}
              onClick={handleSignUp}
              className="flex-1 rounded-xl border border-zinc-300 py-2.5 text-sm font-semibold dark:border-zinc-700"
            >
              新規登録
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="px-4 py-6">
      <h1 className="mb-1 text-lg font-bold">マイページ</h1>
      <p className="mb-4 text-sm text-zinc-500">{user.email}</p>
      <div className="mb-6 flex gap-2">
        <Link
          href="/events/new"
          className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          イベントを投稿
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm dark:border-zinc-700"
        >
          ログアウト
        </button>
      </div>

      <h2 className="mb-3 text-sm font-semibold">投稿したイベント</h2>
      {listError ? <p className="mb-3 text-sm text-red-600">{listError}</p> : null}
      {events.length === 0 ? (
        <p className="text-sm text-zinc-500">まだ投稿がありません。</p>
      ) : (
        <ul className="space-y-3">
          {events.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <Link href={`/events/${item.id}`} className="block">
                <p className="text-xs text-zinc-500">
                  {formatEventDate(item.start_at)}
                </p>
                <p className="mt-1 font-semibold">{item.title}</p>
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="mt-2 text-sm text-red-600"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
