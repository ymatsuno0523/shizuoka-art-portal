import Link from "next/link";
import CircleBrowse from "@/app/components/CircleBrowse";
import FilterSheet from "@/app/components/FilterSheet";
import { getCircles, ORG_KINDS } from "@/lib/circles";
import { REGIONS } from "@/lib/event-form";
import {
  matchesFilter,
  parseFilterValues,
  type SearchParamValue,
} from "@/lib/search-filters";
import { matchesAnyFilter } from "@/lib/labels";

export default async function CirclesPage({
  searchParams,
}: {
  searchParams: Promise<{
    region?: SearchParamValue;
    kind?: SearchParamValue;
    saved?: string;
  }>;
}) {
  const { region: regionParam, kind: kindParam, saved: savedParam } = await searchParams;
  const regions = parseFilterValues(regionParam, REGIONS);
  const kinds = parseFilterValues(kindParam, ORG_KINDS);
  const saved = savedParam === "1";
  const { circles, error } = await getCircles();

  if (error) {
    return (
      <main className="px-4 pt-3 pb-6">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold">団体</h1>
          <Link
            href="/circles/new"
            className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            登録する
          </Link>
        </div>
        <p className="text-sm text-red-600">読み込みに失敗しました: {error.message}</p>
        <p className="mt-2 text-xs text-zinc-500">
          supabase/circles.sql を実行していない場合があります。
        </p>
      </main>
    );
  }

  const filtered = circles.filter((circle) => {
    if (!matchesFilter(circle.region, regions)) return false;
    if (!matchesAnyFilter(circle.kind, kinds)) return false;
    return true;
  });

  return (
    <main className="px-4 pt-3 pb-6">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">団体</h1>
        <Link
          href="/circles/new"
          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          登録する
        </Link>
      </div>
      <FilterSheet
        path="/circles"
        groups={[
          { key: "region", label: "地域", values: regions, options: REGIONS, areas: true },
          { key: "kind", label: "種類", values: kinds, options: ORG_KINDS },
        ]}
        toggles={[{ key: "saved", label: "保存した", checked: saved }]}
      />
      <CircleBrowse circles={filtered} emptyAll={circles.length === 0} saved={saved} />
    </main>
  );
}
