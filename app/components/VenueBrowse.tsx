"use client";

import Link from "next/link";
import MineGate from "@/app/components/MineGate";
import PlacesMap from "@/app/components/PlacesMap";
import { pinFromRegion } from "@/lib/geo";
import type { VenueWithImages } from "@/lib/venues";

export default function VenueBrowse({
  view,
  venues,
  emptyAll,
  saved,
}: {
  view: "list" | "map";
  venues: VenueWithImages[];
  emptyAll: boolean;
  saved?: boolean;
}) {
  return (
    <MineGate items={venues} kind="venue" saved={saved}>
      {(items) => {
        if (emptyAll) {
          return <p className="text-sm text-zinc-500">まだ会場がありません。</p>;
        }
        if (items.length === 0) {
          return <p className="text-sm text-zinc-500">条件に合う会場がありません。</p>;
        }

        const pins = items.map((venue) =>
          pinFromRegion(venue.id, venue.region, {
            title: venue.name,
            href: `/venues/${venue.id}`,
            subtitle: [venue.region, venue.address].filter(Boolean).join(" · "),
          }),
        );
        if (view === "map") return <PlacesMap pins={pins} />;
        return (
          <ul className="space-y-3">
            {items.map((venue) => (
              <li key={venue.id}>
                <Link
                  href={`/venues/${venue.id}`}
                  className="flex items-center gap-3 rounded-[8px] border border-zinc-200 p-2 dark:border-zinc-800"
                >
                  {venue.images[0] ? (
                    <img
                      src={venue.images[0].url}
                      alt=""
                      className="h-[70px] w-[70px] shrink-0 rounded-[6px] object-cover"
                    />
                  ) : (
                    <div className="h-[70px] w-[70px] shrink-0 rounded-[6px] bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{venue.name}</p>
                    {venue.region ? (
                      <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                        {venue.region}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        );
      }}
    </MineGate>
  );
}
