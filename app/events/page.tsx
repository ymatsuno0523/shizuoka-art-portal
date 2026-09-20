import Link from "next/link";
import EventCalendar from "@/app/components/EventCalendar";
import PlacesMap from "@/app/components/PlacesMap";
import ViewSwitcher from "@/app/components/ViewSwitcher";
import { formatEventDate, getEvents } from "@/lib/events";
import { pinFromRegion } from "@/lib/geo";

const EVENT_VIEWS = [
  { id: "list", label: "一覧" },
  { id: "map", label: "マップ" },
  { id: "calendar", label: "カレンダー" },
] as const;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: viewParam } = await searchParams;
  const view =
    viewParam === "map" || viewParam === "calendar" ? viewParam : "list";
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

  const pins = events.map((event) =>
    pinFromRegion(event.id, event.region, {
      title: event.title,
      href: `/events/${event.id}`,
      subtitle: `${formatEventDate(event.start_at)} · ${event.placeLabel}`,
    }),
  );

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
      <ViewSwitcher basePath="/events" views={[...EVENT_VIEWS]} current={view} />

      {view === "map" ? (
        <PlacesMap pins={pins} />
      ) : view === "calendar" ? (
        <EventCalendar
          events={events.map((event) => ({
            id: event.id,
            title: event.title,
            start_at: event.start_at,
            end_at: event.end_at,
            placeLabel: event.placeLabel,
          }))}
        />
      ) : events.length === 0 ? (
        <p className="text-sm text-zinc-500">
          まだイベントがありません。Supabase の events
          テーブルに1件追加すると、ここに表示されます。
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex rounded-[8px] border border-zinc-200 p-2 dark:border-zinc-800"
              >
                {event.images[0] ? (
                  <img
                    src={event.images[0].url}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-[6px] object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 shrink-0 rounded-[6px] bg-zinc-100 dark:bg-zinc-800" />
                )}
                <div className="min-w-0 flex-1 px-3 py-2">
                  <p className="text-xs text-zinc-500">
                    {formatEventDate(event.start_at)}
                  </p>
                  <p className="mt-0.5 truncate font-semibold">{event.title}</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
                    {event.placeLabel}
                  </p>
                  {event.genre ? (
                    <p className="mt-1 truncate text-xs text-zinc-500">{event.genre}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
