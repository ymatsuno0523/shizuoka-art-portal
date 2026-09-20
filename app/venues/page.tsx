import Link from "next/link";
import FilterSheet from "@/app/components/FilterSheet";
import VenueBrowse from "@/app/components/VenueBrowse";
import ViewSwitcher from "@/app/components/ViewSwitcher";
import { REGIONS } from "@/lib/event-form";
import {
  joinFilters,
  matchesFilter,
  parseFilterValues,
  type SearchParamValue,
} from "@/lib/search-filters";
import { getVenues, VENUE_KINDS } from "@/lib/venues";

const VENUE_VIEWS = [
  { id: "list", label: "一覧" },
  { id: "map", label: "マップ" },
] as const;

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    region?: SearchParamValue;
    kind?: SearchParamValue;
    saved?: string;
  }>;
}) {
  const {
    view: viewParam,
    region: regionParam,
    kind: kindParam,
    saved: savedParam,
  } = await searchParams;
  const view = viewParam === "map" ? "map" : "list";
  const regions = parseFilterValues(regionParam, REGIONS);
  const kinds = parseFilterValues(kindParam, VENUE_KINDS);
  const saved = savedParam === "1";
  const filterParams = {
    region: joinFilters(regions, REGIONS),
    kind: joinFilters(kinds, VENUE_KINDS),
    saved: saved ? "1" : undefined,
  };
  const { venues, error } = await getVenues();

  if (error) {
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">施設</h1>
        <p className="text-sm text-red-600">読み込みに失敗しました: {error.message}</p>
      </main>
    );
  }

  const filtered = venues.filter((venue) => {
    if (!matchesFilter(venue.region, regions)) return false;
    if (!matchesFilter(venue.kind, kinds)) return false;
    return true;
  });

  return (
    <main className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">施設</h1>
        <Link
          href="/venues/new"
          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          登録する
        </Link>
      </div>
      <ViewSwitcher
        basePath="/venues"
        views={[...VENUE_VIEWS]}
        current={view}
        params={filterParams}
      />
      <FilterSheet
        path="/venues"
        view={view}
        groups={[
          { key: "region", label: "地域", values: regions, options: REGIONS, areas: true },
          { key: "kind", label: "種類", values: kinds, options: VENUE_KINDS },
        ]}
        toggles={[{ key: "saved", label: "保存した", checked: saved }]}
      />
      <VenueBrowse
        view={view}
        venues={filtered}
        emptyAll={venues.length === 0}
        saved={saved}
      />
    </main>
  );
}
