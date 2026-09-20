import Link from "next/link";
import EventBrowse from "@/app/components/EventBrowse";
import FilterSheet from "@/app/components/FilterSheet";
import ViewSwitcher from "@/app/components/ViewSwitcher";
import { CATEGORIES, REGIONS } from "@/lib/event-form";
import { getEvents, isPastEvent } from "@/lib/events";
import {
  joinFilters,
  matchesFilter,
  parseFilterValues,
  type SearchParamValue,
} from "@/lib/search-filters";

const EVENT_VIEWS = [
  { id: "list", label: "一覧" },
  { id: "map", label: "マップ" },
  { id: "calendar", label: "カレンダー" },
] as const;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    region?: SearchParamValue;
    genre?: SearchParamValue;
    past?: string;
    going?: string;
    saved?: string;
  }>;
}) {
  const {
    view: viewParam,
    region: regionParam,
    genre: genreParam,
    past: pastParam,
    going: goingParam,
    saved: savedParam,
  } = await searchParams;
  const view =
    viewParam === "map" || viewParam === "calendar" ? viewParam : "list";
  const regions = parseFilterValues(regionParam, REGIONS);
  const genres = parseFilterValues(genreParam, CATEGORIES);
  const showPast = pastParam === "1";
  const going = goingParam === "1";
  const saved = savedParam === "1";
  const filterParams = {
    region: joinFilters(regions, REGIONS),
    genre: joinFilters(genres, CATEGORIES),
    past: showPast ? "1" : undefined,
    going: going ? "1" : undefined,
    saved: saved ? "1" : undefined,
  };
  const { events, error } = await getEvents();

  if (error) {
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">イベント</h1>
        <p className="text-sm text-red-600">
          読み込みに失敗しました: {error.message}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Supabase の RLS
          で読み取りが拒否されている場合があります。events
          テーブルの SELECT を匿名でも許可してください。
        </p>
      </main>
    );
  }

  const filtered = events.filter((event) => {
    if (!matchesFilter(event.region, regions)) return false;
    if (!matchesFilter(event.genre, genres)) return false;
    if (!showPast && isPastEvent(event)) return false;
    return true;
  });

  return (
    <main className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">イベント</h1>
        <Link
          href="/events/new"
          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          投稿する
        </Link>
      </div>
      <ViewSwitcher
        basePath="/events"
        views={[...EVENT_VIEWS]}
        current={view}
        params={filterParams}
      />
      <FilterSheet
        path="/events"
        view={view}
        groups={[
          { key: "region", label: "地域", values: regions, options: REGIONS, areas: true },
          { key: "genre", label: "ジャンル", values: genres, options: CATEGORIES },
        ]}
        toggles={[
          { key: "going", label: "行きたい", checked: going },
          { key: "saved", label: "保存した", checked: saved },
          { key: "past", label: "終了したイベントも表示", checked: showPast },
        ]}
      />
      <EventBrowse
        view={view}
        events={filtered}
        emptyAll={events.length === 0}
        going={going}
        saved={saved}
      />
    </main>
  );
}
