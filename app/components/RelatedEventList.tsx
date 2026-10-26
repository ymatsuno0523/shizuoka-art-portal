import Link from "next/link";
import { CategoryChips } from "@/app/components/CategoryChip";
import NoImage from "@/app/components/NoImage";
import {
  formatEventDateRange,
  isCurrentEvent,
  isPastEvent,
  sortEventsForList,
  type EventWithPlace,
} from "@/lib/events";
import { contentHref } from "@/lib/slug";

export default function RelatedEventList({
  title,
  events,
}: {
  title: string;
  events: EventWithPlace[];
}) {
  if (events.length === 0) return null;
  const listed = sortEventsForList(events);

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <ul className="space-y-2">
        {listed.map((event) => (
          <li key={event.id}>
            <Link
              href={contentHref("events", event)}
              className="press-card flex items-center gap-3 rounded-[8px] border border-zinc-200 p-2 dark:border-zinc-800"
            >
              {event.images[0] ? (
                <img
                  src={event.images[0].url}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-[6px] object-cover"
                />
              ) : (
                <NoImage className="h-20 w-20 shrink-0 rounded-[6px]" />
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
                  ) : isCurrentEvent(event) ? (
                    <span className="inline-flex h-4 items-center rounded-full bg-[#db7e45] px-2 text-[10px] font-semibold leading-none text-white">
                      会期中
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate font-semibold">{event.title}</p>
                <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                  <CategoryChips labels={event.genre} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
