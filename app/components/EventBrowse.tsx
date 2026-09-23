"use client";

import Link from "next/link";
import { CategoryChips } from "@/app/components/CategoryChip";
import EventCalendar from "@/app/components/EventCalendar";
import MineGate from "@/app/components/MineGate";
import NoImage from "@/app/components/NoImage";
import PlacesMap from "@/app/components/PlacesMap";
import {
  formatEventDateRange,
  isPastEvent,
  sortEventsForList,
  type EventWithPlace,
} from "@/lib/events";
import type { MapPinSource } from "@/lib/geo";

export default function EventBrowse({
  view,
  events,
  emptyAll,
  going,
  saved,
}: {
  view: "list" | "map" | "calendar";
  events: EventWithPlace[];
  emptyAll: boolean;
  going?: boolean;
  saved?: boolean;
}) {
  return (
    <MineGate items={events} kind="event" going={going} saved={saved}>
      {(items) => {
        if (emptyAll) {
          return (
            <p className="text-sm text-zinc-500">
              まだイベントがありません。Supabase の events
              テーブルに1件追加すると、ここに表示されます。
            </p>
          );
        }
        if (items.length === 0) {
          return <p className="text-sm text-zinc-500">条件に合うイベントがありません。</p>;
        }

        const listed = sortEventsForList(items);
        const pins: MapPinSource[] = items.map((event) => ({
          id: event.id,
          title: event.title,
          href: `/events/${event.id}`,
          subtitle: `${formatEventDateRange(event.start_at, event.end_at)} · ${event.placeLabel}`,
          lat: event.pinLat,
          lng: event.pinLng,
          region: event.region,
          address: event.pinAddress,
        }));

        if (view === "map") return <PlacesMap pins={pins} />;
        if (view === "calendar") {
          return (
            <EventCalendar
              events={items.map((event) => ({
                id: event.id,
                title: event.title,
                start_at: event.start_at,
                end_at: event.end_at,
                placeLabel: event.placeLabel,
              }))}
            />
          );
        }
        return (
          <ul className="space-y-3">
            {listed.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="press-card flex items-center gap-3 rounded-[8px] border border-zinc-200 p-2 dark:border-zinc-800"
                >
                  {event.images[0] ? (
                    <img
                      src={event.images[0].url}
                      alt=""
                      className="h-[70px] w-[70px] shrink-0 rounded-[6px] object-cover"
                    />
                  ) : (
                    <NoImage className="h-[70px] w-[70px] shrink-0 rounded-[6px]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-zinc-500">
                        {formatEventDateRange(event.start_at, event.end_at)}
                      </p>
                      {isPastEvent(event) ? (
                        <span className="inline-flex h-5 items-center rounded-full bg-zinc-100 px-2.5 text-[10px] font-semibold leading-none text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          過去の展示
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate font-semibold">{event.title}</p>
                    <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                      {event.region ? (
                        <p className="min-w-0 truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {event.region}
                        </p>
                      ) : null}
                      <CategoryChips labels={event.genre} />
                    </div>
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
