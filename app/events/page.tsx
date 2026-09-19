import Link from "next/link";
import { formatEventDate, getEvents } from "@/lib/events";

export default async function EventsPage() {
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
      {events.length === 0 ? (
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
                className="block rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <p className="text-xs text-zinc-500">
                  {formatEventDate(event.start_at)}
                </p>
                <p className="mt-1 font-semibold">{event.title}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {event.placeLabel}
                </p>
                {event.genre ? (
                  <p className="mt-2 text-xs text-zinc-500">{event.genre}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
