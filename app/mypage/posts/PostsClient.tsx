"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CategoryChips } from "@/app/components/CategoryChip";
import ThumbCard, { firstImageUrl } from "@/app/components/ThumbCard";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { formatEventDateRange, isPastEvent } from "@/lib/events";
import { deleteOwnedContent } from "@/lib/delete-content";
import { parseLabels } from "@/lib/labels";
import MypageSubpage from "@/app/mypage/MypageSubpage";
import MypageTabs, { parseMypageTab, type MypageTab } from "@/app/mypage/MypageTabs";

type EventItem = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  region: string | null;
  genre: string[];
  imageUrl: string | null;
};

type NamedItem = {
  id: string;
  name: string;
  region: string | null;
  kind: string[];
  imageUrl: string | null;
};

const newHrefs: Record<MypageTab, { href: string; label: string }> = {
  events: { href: "/events/new", label: "イベントを投稿" },
  venues: { href: "/venues/new", label: "施設を登録" },
  circles: { href: "/circles/new", label: "団体を登録" },
};

export default function PostsClient() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const tab = parseMypageTab(searchParams.get("tab"));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [venues, setVenues] = useState<NamedItem[]>([]);
  const [circles, setCircles] = useState<NamedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
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
    const userId = user.id;

    async function loadNamed(
      table: "venues" | "circles",
      imageColumn: "venue_images" | "circle_images",
    ) {
      const withMeta = await supabase
        .from(table)
        .select(`id, name, region, kind, ${imageColumn}(url, sort_order)`)
        .eq("created_by", userId)
        .order("updated_at", { ascending: false });
      if (!withMeta.error) return withMeta;
      return supabase
        .from(table)
        .select(`id, name, region, ${imageColumn}(url, sort_order)`)
        .eq("created_by", userId)
        .order("name");
    }

    Promise.all([
      supabase
        .from("events")
        .select("id, title, start_at, end_at, region, genre, event_images(url, sort_order)")
        .eq("created_by", user.id)
        .order("start_at", { ascending: false }),
      loadNamed("venues", "venue_images"),
      loadNamed("circles", "circle_images"),
    ]).then(([eventResult, venueResult, circleResult]) => {
      setEvents(
        ((eventResult.data ?? []) as {
          id: string;
          title: string;
          start_at: string;
          end_at: string | null;
          region: string | null;
          genre: unknown;
          event_images: { url: string; sort_order: number | null }[] | null;
        }[]).map((item) => ({
          id: item.id,
          title: item.title,
          start_at: item.start_at,
          end_at: item.end_at,
          region: item.region,
          genre: parseLabels(item.genre),
          imageUrl: firstImageUrl(item.event_images),
        })),
      );
      setVenues(
        ((venueResult.data ?? []) as {
          id: string;
          name: string;
          region: string | null;
          kind: unknown;
          venue_images: { url: string; sort_order: number | null }[] | null;
        }[]).map((item) => ({
          id: item.id,
          name: item.name,
          region: item.region,
          kind: parseLabels(item.kind),
          imageUrl: firstImageUrl(item.venue_images),
        })),
      );
      setCircles(
        ((circleResult.data ?? []) as {
          id: string;
          name: string;
          region: string | null;
          kind: unknown;
          circle_images: { url: string; sort_order: number | null }[] | null;
        }[]).map((item) => ({
          id: item.id,
          name: item.name,
          region: item.region,
          kind: parseLabels(item.kind),
          imageUrl: firstImageUrl(item.circle_images),
        })),
      );
      setError(
        eventResult.error?.message ??
          venueResult.error?.message ??
          circleResult.error?.message ??
          null,
      );
      setReady(true);
    });
  }, [user]);

  async function handleDeleteEvent(id: string) {
    if (!confirm("このイベントを削除しますか？")) return;
    const result = await deleteOwnedContent("event", id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEvents((current) => current.filter((item) => item.id !== id));
  }

  async function handleDeleteVenue(id: string) {
    if (!confirm("この施設を削除しますか？画像とPDFも一緒に消えます。")) return;
    const result = await deleteOwnedContent("venue", id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setVenues((current) => current.filter((item) => item.id !== id));
  }

  async function handleDeleteCircle(id: string) {
    if (!confirm("この団体を削除しますか？画像とPDFも一緒に消えます。")) return;
    const result = await deleteOwnedContent("circle", id);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCircles((current) => current.filter((item) => item.id !== id));
  }

  if (loading || (user && !ready)) {
    return (
      <MypageSubpage title="投稿・登録">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </MypageSubpage>
    );
  }

  if (!user) {
    return (
      <MypageSubpage title="投稿・登録">
        <p className="text-sm text-zinc-600">ログインが必要です。</p>
        <Link
          href="/mypage?next=/mypage/posts"
          className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          ログインへ
        </Link>
      </MypageSubpage>
    );
  }

  const create = newHrefs[tab];

  return (
    <MypageSubpage title="投稿・登録">
      <MypageTabs path="/mypage/posts" current={tab} />
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {tab === "events" ? (
        events.length === 0 ? (
          <p className="text-sm text-zinc-500">まだ投稿がありません。</p>
        ) : (
          <ul className="space-y-3">
            {events.map((item) => (
              <ThumbCard
                key={item.id}
                href={`/events/${item.id}`}
                imageUrl={item.imageUrl}
                footer={
                  <EditDeleteActions
                    href={`/events/${item.id}/edit`}
                    onDelete={() => void handleDeleteEvent(item.id)}
                  />
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
          <p className="text-sm text-zinc-500">まだ施設がありません。</p>
        ) : (
          <ul className="space-y-3">
            {venues.map((item) => (
              <ThumbCard
                key={item.id}
                href={`/venues/${item.id}`}
                imageUrl={item.imageUrl}
                footer={
                  <EditDeleteActions
                    href={`/venues/${item.id}/edit`}
                    onDelete={() => void handleDeleteVenue(item.id)}
                  />
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
          <p className="text-sm text-zinc-500">まだ団体がありません。</p>
        ) : (
          <ul className="space-y-3">
            {circles.map((item) => (
              <ThumbCard
                key={item.id}
                href={`/circles/${item.id}`}
                imageUrl={item.imageUrl}
                footer={
                  <EditDeleteActions
                    href={`/circles/${item.id}/edit`}
                    onDelete={() => void handleDeleteCircle(item.id)}
                  />
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

      <Link
        href={create.href}
        className="mt-6 block rounded-xl bg-zinc-900 py-3 text-center text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        {create.label}
      </Link>
    </MypageSubpage>
  );
}

function EditDeleteActions({
  href,
  onDelete,
}: {
  href: string;
  onDelete: () => void;
}) {
  return (
    <div className="-translate-y-px flex" style={{ columnGap: 10 }}>
      <Link href={href} className="text-xs font-semibold">
        編集
      </Link>
      <button type="button" onClick={onDelete} className="text-xs text-red-600">
        削除
      </button>
    </div>
  );
}
