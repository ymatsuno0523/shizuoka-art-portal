import Link from "next/link";
import { notFound } from "next/navigation";
import BackLink from "@/app/components/BackLink";
import CategoryChip from "@/app/components/CategoryChip";
import EventReactionBar from "@/app/components/EventReactionBar";
import ImageSlider from "@/app/components/ImageSlider";
import { InfoLink, InfoRow, infoGridClass } from "@/app/components/InfoRow";
import OwnerEventEditLink from "@/app/components/OwnerEventEditLink";
import PdfLinks from "@/app/components/PdfLinks";
import { formatEventDateRange, getEvent } from "@/lib/events";

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

  const dateLabel = formatEventDateRange(event.start_at, event.end_at);

  return (
    <main className="px-4 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-zinc-500">{dateLabel}</p>
        <CategoryChip label={event.genre} />
      </div>
      <h1 className="mt-1 text-xl font-bold">{event.title}</h1>
      <EventReactionBar eventId={event.id} createdBy={event.created_by} />
      <div className="mt-4">
        <ImageSlider
          urls={event.images.map((image) => image.url)}
          alt={event.title}
        />
      </div>
      {event.description ? (
        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
          {event.description}
        </p>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">詳細文はまだありません。</p>
      )}

      <h2 className="mt-8 text-sm font-semibold">案内</h2>
      <dl className="mt-1 divide-y divide-zinc-200 dark:divide-zinc-800">
        <InfoRow label="開催日" value={dateLabel} />
        <InfoRow label="開催時間" value={event.time_text} />
        <InfoRow label="補足" value={event.schedule_note} />
        <InfoRow label="会場" value={event.placeLabel} />
        <InfoRow label="市" value={event.region} />
        <InfoRow label="料金" value={event.fee_text} />
        {event.circle_id && event.organizerLabel ? (
          <div className={infoGridClass}>
            <dt className="text-zinc-500">主催</dt>
            <dd>
              <Link href={`/circles/${event.circle_id}`} className="underline">
                {event.organizerLabel}
              </Link>
            </dd>
          </div>
        ) : (
          <InfoRow label="主催" value={event.organizerLabel} />
        )}
        <InfoRow label="問い合わせ" value={event.contact_name} />
        <InfoRow label="電話" value={event.contact_phone} />
        <InfoRow label="メール" value={event.contact_email} />
        <InfoLink label="HP" href={event.website_url} />
        <InfoRow label="駐車場" value={event.parking_text} />
      </dl>
      <PdfLinks files={event.files} />

      <div className="mt-8 flex flex-col items-center gap-3">
        <BackLink href="/events">戻る</BackLink>
        <OwnerEventEditLink eventId={event.id} createdBy={event.created_by} />
      </div>
    </main>
  );
}
