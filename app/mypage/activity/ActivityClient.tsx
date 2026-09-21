"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CategoryChips } from "@/app/components/CategoryChip";
import { BookmarkIcon, compactSaveButtonClass } from "@/app/components/SaveButton";
import ThumbCard, { firstImageUrl } from "@/app/components/ThumbCard";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import {
  formatEventDateRange,
  isPastEvent,
} from "@/lib/events";
import { parseLabels } from "@/lib/labels";
import { embedOne } from "@/app/mypage/embed";
import MypageSubpage from "@/app/mypage/MypageSubpage";
import MypageTabs, { parseMypageTab } from "@/app/mypage/MypageTabs";

type EventItem = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  region: string | null;
  genre: string[];
  imageUrl: string | null;
  going: boolean;
  saved: boolean;
};

type NamedItem = {
  id: string;
  name: string;
  region: string | null;
  kind: string[];
  imageUrl: string | null;
};

type EventEmbed = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  region: string | null;
  genre: unknown;
  event_images: { url: string; sort_order: number | null }[] | null;
};

type NamedEmbed = {
  id: string;
  name: string;
  region: string | null;
  kind?: unknown;
  venue_images?: { url: string; sort_order: number | null }[] | null;
  circle_images?: { url: string; sort_order: number | null }[] | null;
};

function toEventItem(value: EventEmbed, flags: { going?: boolean; saved?: boolean }): EventItem {
  return {
    id: value.id,
    title: value.title,
    start_at: value.start_at,
    end_at: value.end_at,
    region: value.region,
    genre: parseLabels(value.genre),
    imageUrl: firstImageUrl(value.event_images),
    going: Boolean(flags.going),
    saved: Boolean(flags.saved),
  };
}

export default function ActivityClient() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const tab = parseMypageTab(searchParams.get("tab"));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [venues, setVenues] = useState<NamedItem[]>([]);
  const [circles, setCircles] = useState<NamedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setVenues([]);
      setCircles([]);
      setReady(true);
      return;
    }

    const supabase = createBrowserSupabase();
    Promise.all([
      supabase
        .from("event_going")
        .select(
          "created_at, events(id, title, start_at, end_at, region, genre, event_images(url, sort_order))",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("event_saves")
        .select(
          "created_at, events(id, title, start_at, end_at, region, genre, event_images(url, sort_order))",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      (async () => {
        const withKind = await supabase
          .from("venue_saves")
          .select("created_at, venues(id, name, region, kind, venue_images(url, sort_order))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (!withKind.error) return withKind;
        return supabase
          .from("venue_saves")
          .select("created_at, venues(id, name, region, venue_images(url, sort_order))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
      })(),
      (async () => {
        const withKind = await supabase
          .from("circle_saves")
          .select("created_at, circles(id, name, region, kind, circle_images(url, sort_order))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (!withKind.error) return withKind;
        return supabase
          .from("circle_saves")
          .select("created_at, circles(id, name, region, circle_images(url, sort_order))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
      })(),
    ]).then(([goingResult, saveResult, venueResult, circleResult]) => {
      const merged = new Map<string, EventItem>();
      for (const row of (goingResult.data ?? []) as { events: EventEmbed | EventEmbed[] | null }[]) {
        const event = embedOne(row.events);
        if (!event) continue;
        merged.set(event.id, toEventItem(event, { going: true }));
      }
      for (const row of (saveResult.data ?? []) as { events: EventEmbed | EventEmbed[] | null }[]) {
        const event = embedOne(row.events);
        if (!event) continue;
        const current = merged.get(event.id);
        if (current) current.saved = true;
        else merged.set(event.id, toEventItem(event, { saved: true }));
      }
      setEvents([...merged.values()]);
      setVenues(
        ((venueResult.data ?? []) as { venues: NamedEmbed | NamedEmbed[] | null }[])
          .map((row) => embedOne(row.venues))
          .filter((item): item is NamedEmbed => Boolean(item))
          .map((item) => ({
            id: item.id,
            name: item.name,
            region: item.region,
            kind: parseLabels(item.kind),
            imageUrl: firstImageUrl(item.venue_images),
          })),
      );
      setCircles(
        ((circleResult.data ?? []) as { circles: NamedEmbed | NamedEmbed[] | null }[])
          .map((row) => embedOne(row.circles))
          .filter((item): item is NamedEmbed => Boolean(item))
          .map((item) => ({
            id: item.id,
            name: item.name,
            region: item.region,
            kind: parseLabels(item.kind),
            imageUrl: firstImageUrl(item.circle_images),
          })),
      );
      setError(
        goingResult.error?.message ??
          saveResult.error?.message ??
          venueResult.error?.message ??
          circleResult.error?.message ??
          null,
      );
      setReady(true);
    });
  }, [user]);

  async function toggleEvent(item: EventItem, field: "going" | "saved") {
    if (!user || busy) return;
    const supabase = createBrowserSupabase();
    const next = !item[field];
    setBusy(`${item.id}-${field}`);
    const table = field === "going" ? "event_going" : "event_saves";
    const result = next
      ? await supabase.from(table).insert({ event_id: item.id, user_id: user.id })
      : await supabase.from(table).delete().eq("event_id", item.id).eq("user_id", user.id);
    setBusy(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setEvents((current) =>
      current.flatMap((event) => {
        if (event.id !== item.id) return [event];
        const updated = { ...event, [field]: next };
        if (!updated.going && !updated.saved) return [];
        return [updated];
      }),
    );
  }

  async function unsaveNamed(
    kind: "venue" | "circle",
    id: string,
  ) {
    if (!user || busy) return;
    const supabase = createBrowserSupabase();
    setBusy(id);
    const spec =
      kind === "venue"
        ? { table: "venue_saves" as const, column: "venue_id" }
        : { table: "circle_saves" as const, column: "circle_id" };
    const { error: deleteError } = await supabase
      .from(spec.table)
      .delete()
      .eq(spec.column, id)
      .eq("user_id", user.id);
    setBusy(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (kind === "venue") {
      setVenues((current) => current.filter((item) => item.id !== id));
    } else {
      setCircles((current) => current.filter((item) => item.id !== id));
    }
  }

  if (loading || (user && !ready)) {
    return (
      <MypageSubpage title="行きたい・保存">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </MypageSubpage>
    );
  }

  if (!user) {
    return (
      <MypageSubpage title="行きたい・保存">
        <p className="text-sm text-zinc-600">ログインが必要です。</p>
        <Link
          href="/mypage?next=/mypage/activity"
          className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          ログインへ
        </Link>
      </MypageSubpage>
    );
  }

  return (
    <MypageSubpage title="行きたい・保存">
      <MypageTabs path="/mypage/activity" current={tab} />
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {tab === "events" ? (
        events.length === 0 ? (
          <p className="text-sm text-zinc-500">まだありません。</p>
        ) : (
          <ul className="space-y-3">
            {events.map((item) => (
              <ThumbCard
                key={item.id}
                href={`/events/${item.id}`}
                imageUrl={item.imageUrl}
                footer={
                  <>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void toggleEvent(item, "going")}
                      className={compactSaveButtonClass(item.going)}
                      aria-pressed={item.going}
                    >
                      <FlagIcon filled={item.going} />
                      行きたい
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void toggleEvent(item, "saved")}
                      className={compactSaveButtonClass(item.saved)}
                      aria-pressed={item.saved}
                    >
                      <BookmarkIcon filled={item.saved} className="h-3 w-3" />
                      保存
                    </button>
                  </>
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-zinc-500">
                    {formatEventDateRange(item.start_at, item.end_at)}
                  </p>
                  {isPastEvent(item) ? (
                    <span className="inline-flex h-5 items-center rounded-full bg-zinc-100 px-2.5 text-[10px] font-semibold leading-none text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      過去の展示
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate font-semibold">{item.title}</p>
                <div className="mt-0.5 flex min-w-0 items-center gap-2">
                  {item.region ? (
                    <p className="min-w-0 truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {item.region}
                    </p>
                  ) : null}
                  <CategoryChips labels={item.genre} />
                </div>
              </ThumbCard>
            ))}
          </ul>
        )
      ) : null}

      {tab === "venues" ? (
        venues.length === 0 ? (
          <p className="text-sm text-zinc-500">まだありません。</p>
        ) : (
          <ul className="space-y-3">
            {venues.map((item) => (
              <ThumbCard
                key={item.id}
                href={`/venues/${item.id}`}
                imageUrl={item.imageUrl}
                footer={
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void unsaveNamed("venue", item.id)}
                    className={compactSaveButtonClass(true)}
                    aria-pressed
                  >
                    <BookmarkIcon filled className="h-3 w-3" />
                    保存
                  </button>
                }
              >
                <p className="truncate font-semibold">{item.name}</p>
                <div className="mt-0.5 flex min-w-0 items-center gap-2">
                  {item.region ? (
                    <p className="min-w-0 truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {item.region}
                    </p>
                  ) : null}
                  <CategoryChips labels={item.kind} />
                </div>
              </ThumbCard>
            ))}
          </ul>
        )
      ) : null}

      {tab === "circles" ? (
        circles.length === 0 ? (
          <p className="text-sm text-zinc-500">まだありません。</p>
        ) : (
          <ul className="space-y-3">
            {circles.map((item) => (
              <ThumbCard
                key={item.id}
                href={`/circles/${item.id}`}
                imageUrl={item.imageUrl}
                footer={
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void unsaveNamed("circle", item.id)}
                    className={compactSaveButtonClass(true)}
                    aria-pressed
                  >
                    <BookmarkIcon filled className="h-3 w-3" />
                    保存
                  </button>
                }
              >
                <p className="truncate font-semibold">{item.name}</p>
                <div className="mt-0.5 flex min-w-0 items-center gap-2">
                  {item.region ? (
                    <p className="min-w-0 truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {item.region}
                    </p>
                  ) : null}
                  <CategoryChips labels={item.kind} />
                </div>
              </ThumbCard>
            ))}
          </ul>
        )
      ) : null}
    </MypageSubpage>
  );
}

function FlagIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M5 21V4" />
      <path d="M5 5h12l-2 3.5L17 12H5" />
    </svg>
  );
}
