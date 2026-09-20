"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { formatEventDate, type EventRow } from "@/lib/events";
import { storagePathFromPublicUrl } from "@/lib/images";

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
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [circles, setCircles] = useState<{ id: string; name: string }[]>([]);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setVenues([]);
      setCircles([]);
      setProfile(null);
      return;
    }

    const supabase = createBrowserSupabase();
    Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("created_by", user.id)
        .order("start_at", { ascending: false }),
      supabase
        .from("venues")
        .select("id, name")
        .eq("created_by", user.id)
        .order("name"),
      supabase
        .from("circles")
        .select("id, name")
        .eq("created_by", user.id)
        .order("name"),
      supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
    ]).then(([eventResult, venueResult, circleResult, profileResult]) => {
      if (eventResult.error) {
        setListError(eventResult.error.message);
        return;
      }
      if (venueResult.error) {
        setListError(venueResult.error.message);
        return;
      }
      setEvents((eventResult.data ?? []) as EventRow[]);
      setVenues((venueResult.data ?? []) as { id: string; name: string }[]);
      setCircles((circleResult.data ?? []) as { id: string; name: string }[]);
      setListError(
        circleResult.error?.message ?? profileResult.error?.message ?? null,
      );
      setProfile(
        (profileResult.data as {
          display_name: string | null;
          avatar_url: string | null;
        } | null) ?? null,
      );
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

  async function handleDeleteCircle(id: string) {
    if (!confirm("このサークルを削除しますか？画像も一緒に消えます。")) return;
    const supabase = createBrowserSupabase();
    const { data: images } = await supabase
      .from("circle_images")
      .select("url")
      .eq("circle_id", id);
    const paths = (images ?? [])
      .map((image) => storagePathFromPublicUrl(image.url, "circle-images"))
      .filter((path): path is string => Boolean(path));
    if (paths.length > 0) {
      await supabase.storage.from("circle-images").remove(paths);
    }
    const { error } = await supabase.from("circles").delete().eq("id", id);
    if (error) {
      setListError(error.message);
      return;
    }
    setCircles((current) => current.filter((item) => item.id !== id));
  }

  async function handleDeleteVenue(id: string) {
    if (!confirm("この会場を削除しますか？画像も一緒に消えます。")) return;
    const supabase = createBrowserSupabase();
    const { data: images } = await supabase
      .from("venue_images")
      .select("url")
      .eq("venue_id", id);
    const paths = (images ?? [])
      .map((image) => storagePathFromPublicUrl(image.url, "venue-images"))
      .filter((path): path is string => Boolean(path));
    if (paths.length > 0) {
      await supabase.storage.from("venue-images").remove(paths);
    }
    const { error } = await supabase.from("venues").delete().eq("id", id);
    if (error) {
      setListError(error.message);
      return;
    }
    setVenues((current) => current.filter((item) => item.id !== id));
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
          ログインするとイベント・会場・サークルを投稿・削除できます。
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
      <div className="mb-4 flex items-center gap-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-12 w-12 rounded-full object-contain"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        )}
        <div>
          <p className="font-semibold">{profile?.display_name || "名前未設定"}</p>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
      </div>
      <Link
        href="/mypage/profile"
        className="mb-6 inline-block text-sm font-semibold underline"
      >
        プロフィールを編集
      </Link>

      <h2 className="mb-3 text-sm font-semibold">お気に入り</h2>
      <p className="mb-8 text-sm text-zinc-500">
        まだお気に入りはありません。あとからイベント・会場・サークルを保存できるようにします。
      </p>

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
              <div className="mt-2 flex gap-3">
                <Link
                  href={`/events/${item.id}/edit`}
                  className="text-sm font-semibold"
                >
                  編集
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-sm text-red-600"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 mb-3 text-sm font-semibold">登録した会場</h2>
      {venues.length === 0 ? (
        <p className="text-sm text-zinc-500">まだ会場がありません。</p>
      ) : (
        <ul className="space-y-3">
          {venues.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <Link href={`/venues/${item.id}`} className="block font-semibold">
                {item.name}
              </Link>
              <button
                type="button"
                onClick={() => handleDeleteVenue(item.id)}
                className="mt-2 text-sm text-red-600"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 mb-3 text-sm font-semibold">登録したサークル</h2>
      {circles.length === 0 ? (
        <p className="text-sm text-zinc-500">まだサークルがありません。</p>
      ) : (
        <ul className="space-y-3">
          {circles.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <Link href={`/circles/${item.id}`} className="block font-semibold">
                {item.name}
              </Link>
              <div className="mt-2 flex gap-3">
                <Link
                  href={`/circles/${item.id}/edit`}
                  className="text-sm font-semibold"
                >
                  編集
                </Link>
                <button
                  type="button"
                  onClick={() => handleDeleteCircle(item.id)}
                  className="text-sm text-red-600"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex flex-col gap-2">
        <Link
          href="/events/new"
          className="rounded-xl bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          イベントを投稿
        </Link>
        <Link
          href="/venues/new"
          className="rounded-xl border border-zinc-300 py-2.5 text-center text-sm font-semibold dark:border-zinc-700"
        >
          会場を登録
        </Link>
        <Link
          href="/circles/new"
          className="rounded-xl border border-zinc-300 py-2.5 text-center text-sm font-semibold dark:border-zinc-700"
        >
          サークルを登録
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm dark:border-zinc-700"
        >
          ログアウト
        </button>
      </div>
    </main>
  );
}
