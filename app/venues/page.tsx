import Link from "next/link";
import PlacesMap from "@/app/components/PlacesMap";
import ViewSwitcher from "@/app/components/ViewSwitcher";
import { pinFromRegion } from "@/lib/geo";
import { getVenues } from "@/lib/venues";

const VENUE_VIEWS = [
  { id: "list", label: "一覧" },
  { id: "map", label: "マップ" },
] as const;

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: viewParam } = await searchParams;
  const view = viewParam === "map" ? "map" : "list";
  const { venues, error } = await getVenues();

  if (error) {
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">会場・施設</h1>
        <p className="text-sm text-red-600">読み込みに失敗しました: {error.message}</p>
      </main>
    );
  }

  const pins = venues.map((venue) =>
    pinFromRegion(venue.id, venue.region, {
      title: venue.name,
      href: `/venues/${venue.id}`,
      subtitle: [venue.region, venue.address].filter(Boolean).join(" · "),
    }),
  );

  return (
    <main className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">会場・施設</h1>
        <Link
          href="/venues/new"
          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          登録する
        </Link>
      </div>
      <ViewSwitcher basePath="/venues" views={[...VENUE_VIEWS]} current={view} />

      {view === "map" ? (
        <PlacesMap pins={pins} />
      ) : venues.length === 0 ? (
        <p className="text-sm text-zinc-500">まだ会場がありません。</p>
      ) : (
        <ul className="space-y-3">
          {venues.map((venue) => (
            <li key={venue.id}>
              <Link
                href={`/venues/${venue.id}`}
                className="flex rounded-[8px] border border-zinc-200 p-2 dark:border-zinc-800"
              >
                {venue.imageUrls[0] ? (
                  <img
                    src={venue.imageUrls[0]}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-[6px] object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 shrink-0 rounded-[6px] bg-zinc-100 dark:bg-zinc-800" />
                )}
                <div className="min-w-0 flex-1 px-3 py-2">
                  <p className="font-semibold">{venue.name}</p>
                  <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                    {venue.region}
                    {venue.address ? ` · ${venue.address}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
