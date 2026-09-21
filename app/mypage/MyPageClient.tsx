"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { embedOne } from "@/app/mypage/embed";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

type SavedEvent = { id: string };
type SavedNamed = { id: string };

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
  const [eventCount, setEventCount] = useState(0);
  const [venueCount, setVenueCount] = useState(0);
  const [circleCount, setCircleCount] = useState(0);
  const [goingCount, setGoingCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEventCount(0);
      setVenueCount(0);
      setCircleCount(0);
      setGoingCount(0);
      setSavedCount(0);
      setProfile(null);
      return;
    }

    const supabase = createBrowserSupabase();
    Promise.all([
      supabase.from("events").select("id").eq("created_by", user.id),
      supabase.from("venues").select("id").eq("created_by", user.id),
      supabase.from("circles").select("id").eq("created_by", user.id),
      supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("event_going").select("event_id").eq("user_id", user.id),
      supabase
        .from("event_saves")
        .select("created_at, events(id)")
        .eq("user_id", user.id),
      supabase
        .from("venue_saves")
        .select("created_at, venues(id)")
        .eq("user_id", user.id),
      supabase
        .from("circle_saves")
        .select("created_at, circles(id)")
        .eq("user_id", user.id),
    ]).then(
      ([
        eventResult,
        venueResult,
        circleResult,
        profileResult,
        goingResult,
        saveResult,
        venueSaveResult,
        circleSaveResult,
      ]) => {
        setEventCount((eventResult.data ?? []).length);
        setVenueCount((venueResult.data ?? []).length);
        setCircleCount((circleResult.data ?? []).length);
        setGoingCount((goingResult.data ?? []).length);
        const savedEvents = saveResult.error
          ? []
          : ((saveResult.data ?? []) as { events: SavedEvent | SavedEvent[] | null }[])
              .map((row) => embedOne(row.events))
              .filter((item): item is SavedEvent => Boolean(item));
        const savedVenues = venueSaveResult.error
          ? []
          : ((venueSaveResult.data ?? []) as { venues: SavedNamed | SavedNamed[] | null }[])
              .map((row) => embedOne(row.venues))
              .filter((item): item is SavedNamed => Boolean(item));
        const savedCircles = circleSaveResult.error
          ? []
          : ((circleSaveResult.data ?? []) as { circles: SavedNamed | SavedNamed[] | null }[])
              .map((row) => embedOne(row.circles))
              .filter((item): item is SavedNamed => Boolean(item));
        setSavedCount(savedEvents.length + savedVenues.length + savedCircles.length);
        setProfile(
          (profileResult.data as {
            display_name: string | null;
            avatar_url: string | null;
          } | null) ?? null,
        );
        setListError(
          eventResult.error?.message ??
            venueResult.error?.message ??
            circleResult.error?.message ??
            profileResult.error?.message ??
            null,
        );
      },
    );
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
          ログインすると投稿のほか、行きたい・保存が使えます。
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
        <p className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
          <Link href="/mypage/news">お知らせ</Link>
          <Link href="/mypage/terms">利用規約</Link>
          <Link href="/mypage/privacy">プライバシー</Link>
          <Link href="/mypage/help">ヘルプ</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="px-4 py-6">
      <h1 className="mb-4 text-lg font-bold">マイページ</h1>
      <section className="mb-6 flex items-center gap-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-14 w-14 rounded-full object-contain"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{profile?.display_name || "名前未設定"}</p>
          <p className="truncate text-sm text-zinc-500">{user.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link href="/mypage/profile" className="text-sm font-semibold">
              プロフィールを編集
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="text-sm text-zinc-500"
            >
              ログアウト
            </button>
          </div>
        </div>
      </section>

      {listError ? <p className="mb-3 text-sm text-red-600">{listError}</p> : null}

      <section className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <MenuRow
          href="/mypage/activity"
          title="行きたい・保存"
          caption={`行きたい ${goingCount} · 保存 ${savedCount}`}
        />
        <MenuRow
          href="/mypage/posts"
          title="投稿・登録"
          caption={`イベント ${eventCount} · 施設 ${venueCount} · 団体 ${circleCount}`}
        />
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <MenuRow href="/mypage/news" title="お知らせ" />
        <MenuRow href="/mypage/terms" title="利用規約" />
        <MenuRow href="/mypage/privacy" title="プライバシーポリシー" />
        <MenuRow href="/mypage/help" title="ヘルプ" />
      </section>
    </main>
  );
}

function MenuRow({
  href,
  title,
  caption,
}: {
  href: string;
  title: string;
  caption?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-800"
    >
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {caption ? <p className="mt-0.5 text-xs text-zinc-500">{caption}</p> : null}
      </div>
      <span className="text-zinc-400" aria-hidden>
        ›
      </span>
    </Link>
  );
}
