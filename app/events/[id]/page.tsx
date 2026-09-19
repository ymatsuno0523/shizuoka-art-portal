import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEventDate, getEvent } from "@/lib/events";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { event, error } = await getEvent(id);

  if (error) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-red-600">
          読み込みに失敗しました: {error.message}
        </p>
      </main>
    );
  }

  if (!event) notFound();

  return (
    <main className="px-4 py-6">
      <Link href="/events" className="text-sm text-zinc-500">
        ← 一覧へ
      </Link>
      <p className="mt-4 text-xs text-zinc-500">
        {formatEventDate(event.start_at)}
        {event.end_at ? ` 〜 ${formatEventDate(event.end_at)}` : null}
      </p>
      <h1 className="mt-1 text-xl font-bold">{event.title}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {event.placeLabel}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
        {event.region ? <span>{event.region}</span> : null}
        {event.genre ? <span>{event.genre}</span> : null}
        {event.medium ? <span>{event.medium}</span> : null}
      </div>
      {event.description ? (
        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
          {event.description}
        </p>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">詳細文はまだありません。</p>
      )}
    </main>
  );
}
