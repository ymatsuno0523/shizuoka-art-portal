"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { rememberAuthNext } from "@/lib/auth-next";
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
  const [forgot, setForgot] = useState(false);
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

  async function handleGoogle() {
    setAuthError(null);
    setAuthMessage(null);
    setAuthBusy(true);
    rememberAuthNext(nextPath);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setAuthBusy(false);
      setAuthError(error.message);
    }
  }

  async function handleForgot() {
    setAuthError(null);
    setAuthMessage(null);
    if (!email) {
      setAuthError("再設定するメールアドレスを入力してください。");
      return;
    }
    setAuthBusy(true);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setAuthBusy(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthMessage(
      "メールを送りました。届いたリンクから新しいパスワードを設定してください。迷惑メールも確認してください。",
    );
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
        {forgot ? (
          <>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              登録したメールに、再設定用のリンクを送ります。
            </p>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleForgot();
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
              {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
              {authMessage ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{authMessage}</p>
              ) : null}
              <button
                type="submit"
                disabled={authBusy}
                className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
              >
                メールを送る
              </button>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => {
                  setForgot(false);
                  setAuthError(null);
                  setAuthMessage(null);
                }}
                className="w-full text-sm text-zinc-500"
              >
                ログインに戻る
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              ログインすると投稿のほか、行きたい・保存が使えます。
            </p>
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void handleGoogle()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2.5 text-sm font-semibold disabled:opacity-60 dark:border-zinc-700"
            >
              <GoogleMark />
              Googleで続ける
            </button>
            <p className="my-4 text-center text-xs text-zinc-400">または</p>
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
              <button
                type="button"
                disabled={authBusy}
                onClick={() => {
                  setForgot(true);
                  setAuthError(null);
                  setAuthMessage(null);
                }}
                className="w-full text-xs text-zinc-500"
              >
                パスワードを忘れた
              </button>
            </form>
          </>
        )}
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

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
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
