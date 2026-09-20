import { notFound } from "next/navigation";
import BackLink from "@/app/components/BackLink";
import ImageSlider from "@/app/components/ImageSlider";
import { InfoLink, InfoRow } from "@/app/components/InfoRow";
import OwnerEditLink from "@/app/components/OwnerEditLink";
import SaveButton from "@/app/components/SaveButton";
import SnsIconLinks from "@/app/components/SnsIconLinks";
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
          supabase/venue-fields.sql を実行していない場合があります。
        </p>
      </main>
    );
  }

  if (!venue) notFound();

  return (
    <main className="px-4 py-6">
      <h1 className="text-xl font-bold">{venue.name}</h1>
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

      <h2 className="mt-8 text-sm font-semibold">案内</h2>
      <dl className="mt-1 divide-y divide-zinc-200 dark:divide-zinc-800">
        <InfoRow label="住所" value={venue.address} />
        <InfoRow label="市" value={venue.region} />
        <InfoRow label="電話" value={venue.phone} />
        <InfoRow label="営業時間" value={venue.hours_text} />
        <InfoRow label="定休日" value={venue.holiday_text} />
        <InfoRow label="料金" value={venue.fee_text} />
        <InfoRow label="交通機関" value={venue.access_transit} />
        <InfoRow label="車" value={venue.access_car} />
        <InfoRow label="駐車場" value={venue.parking_text} />
        <InfoRow label="支払い" value={venue.payment_text} />
        <InfoLink label="HP" href={venue.website_url} />
        <SnsIconLinks
          urls={{
            sns_instagram: venue.sns_instagram,
            sns_x: venue.sns_x,
            sns_facebook: venue.sns_facebook,
            sns_youtube: venue.sns_youtube,
            sns_tiktok: venue.sns_tiktok,
            sns_line: venue.sns_line,
          }}
        />
      </dl>

      <div className="mt-8 flex flex-col items-center gap-3">
        <BackLink href="/venues">戻る</BackLink>
        <OwnerEditLink href={`/venues/${venue.id}/edit`} createdBy={venue.created_by} />
      </div>
    </main>
  );
}
