import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BackLink from "@/app/components/BackLink";
import { CategoryChips } from "@/app/components/CategoryChip";
import EventReactionBar from "@/app/components/EventReactionBar";
import ImageSlider from "@/app/components/ImageSlider";
import { InfoLink, InfoRow, infoGridClass } from "@/app/components/InfoRow";
import OwnerActions from "@/app/components/OwnerActions";
import PdfLinks from "@/app/components/PdfLinks";
import { formatEventDateRange, getEvent } from "@/lib/events";
import { contentHref, replacedSlugPath } from "@/lib/slug";

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
  const canonical = replacedSlugPath("events", id, event.slug);
  if (canonical) redirect(canonical);

  const dateLabel = formatEventDateRange(event.start_at, event.end_at);

  return (
    <main className="px-4 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-zinc-500">{dateLabel}</p>
        <CategoryChips labels={event.genre} />
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

      <dl className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        <InfoRow label="開催日" value={dateLabel} />
        <InfoRow label="開催時間" value={event.time_text} />
        <InfoRow label="補足" value={event.schedule_note} />
        {event.placeLabel ? (
          event.venueLinked ? (
            <div className={infoGridClass}>
              <dt className="text-zinc-500">会場</dt>
              <dd>
                <Link
                  href={contentHref("venues", {
                    id: event.venue_id!,
                    slug: event.venueSlug,
                  })}
                  className="underline"
                >
                  {event.placeLabel}
                </Link>
              </dd>
            </div>
          ) : (
            <InfoRow label="会場" value={event.placeLabel} />
          )
        ) : null}
        <InfoRow label="住所" value={event.pinAddress} />
        <InfoRow label="地域" value={event.pinAddress?.trim() ? null : event.region} />
        <InfoRow label="料金" value={event.fee_text} />
        {event.organizerLabel ? (
          event.circleLinked ? (
            <div className={infoGridClass}>
              <dt className="text-zinc-500">主催</dt>
              <dd>
                <Link
                  href={contentHref("circles", {
                    id: event.circle_id!,
                    slug: event.circleSlug,
                  })}
                  className="underline"
                >
                  {event.organizerLabel}
                </Link>
              </dd>
            </div>
          ) : (
            <InfoRow label="主催" value={event.organizerLabel} />
          )
        ) : null}
        <InfoRow label="共催・後援" value={event.support_text} />
        <InfoRow label="問い合わせ" value={event.contact_name} />
        <InfoRow label="電話" value={event.contact_phone} />
        <InfoRow label="メール" value={event.contact_email} />
        <InfoLink label="HP" href={event.website_url} />
        <InfoRow label="駐車場" value={event.parking_text} />
        <PdfLinks files={event.files} />
      </dl>

      <div className="mt-8 flex flex-col items-center gap-3">
        <BackLink href="/events">戻る</BackLink>
        <OwnerActions
          kind="event"
          id={event.id}
          editHref={contentHref("events", event, "/edit")}
          createdBy={event.created_by}
          listHref="/events"
        />
      </div>
    </main>
  );
}
