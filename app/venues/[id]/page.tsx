import { notFound } from "next/navigation";
import BackLink from "@/app/components/BackLink";
import { CategoryChips } from "@/app/components/CategoryChip";
import ImageSlider from "@/app/components/ImageSlider";
import { InfoLink, InfoRow } from "@/app/components/InfoRow";
import OwnerActions from "@/app/components/OwnerActions";
import PdfLinks from "@/app/components/PdfLinks";
import SaveButton from "@/app/components/SaveButton";
import SnsIconLinks from "@/app/components/SnsIconLinks";
import { joinLabels } from "@/lib/labels";
import { getVenue } from "@/lib/venues";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { venue, error } = await getVenue(id);

  if (error) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-red-600">読み込みに失敗しました: {error.message}</p>
        <p className="mt-2 text-xs text-zinc-500">
          supabase/multi-labels.sql を実行していない場合があります。
        </p>
      </main>
    );
  }

  if (!venue) notFound();

  return (
    <main className="px-4 py-6">
      <CategoryChips labels={venue.kind} />
      <h1 className="mt-1 text-xl font-bold">{venue.name}</h1>
      <div className="mt-3">
        <SaveButton
          table="venue_saves"
          idColumn="venue_id"
          entityId={venue.id}
          loginPath={`/venues/${venue.id}`}
        />
      </div>
      <div className="mt-4">
        <ImageSlider
          urls={venue.images.map((image) => image.url)}
          alt={venue.name}
        />
      </div>
      {venue.description ? (
        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
          {venue.description}
        </p>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">詳細文はまだありません。</p>
      )}

      <dl className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        <InfoRow label="種類" value={joinLabels(venue.kind)} />
        <InfoRow label="住所" value={venue.address} />
        <InfoRow label="地域" value={venue.address?.trim() ? null : venue.region} />
        <InfoRow label="電話" value={venue.phone} />
        <InfoRow label="営業時間" value={venue.hours_text} />
        <InfoRow label="定休日" value={venue.holiday_text} />
        <InfoRow label="料金" value={venue.fee_text} />
        <InfoRow label="交通機関" value={venue.access_transit} />
        <InfoRow label="車" value={venue.access_car} />
        <InfoRow label="駐車場" value={venue.parking_text} />
        <InfoRow label="支払い" value={venue.payment_text} />
        <InfoLink label="HP" href={venue.website_url} />
        <PdfLinks files={venue.files} />
        <SnsIconLinks
          urls={{
            sns_instagram: venue.sns_instagram,
            sns_x: venue.sns_x,
            sns_line: venue.sns_line,
          }}
        />
      </dl>

      <div className="mt-8 flex flex-col items-center gap-3">
        <BackLink href="/venues">戻る</BackLink>
        <OwnerActions
          kind="venue"
          id={venue.id}
          editHref={`/venues/${venue.id}/edit`}
          createdBy={venue.created_by}
          listHref="/venues"
        />
      </div>
    </main>
  );
}
