import { notFound } from "next/navigation";
import BackLink from "@/app/components/BackLink";
import CategoryChip from "@/app/components/CategoryChip";
import ImageSlider from "@/app/components/ImageSlider";
import { InfoLink, InfoRow } from "@/app/components/InfoRow";
import OwnerEditLink from "@/app/components/OwnerEditLink";
import PdfLinks from "@/app/components/PdfLinks";
import SaveButton from "@/app/components/SaveButton";
import SnsIconLinks from "@/app/components/SnsIconLinks";
import { getCircle } from "@/lib/circles";

export default async function CircleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { circle, error } = await getCircle(id);

  if (error) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-red-600">読み込みに失敗しました: {error.message}</p>
        <p className="mt-2 text-xs text-zinc-500">
          supabase/circles-fields.sql を実行していない場合があります。
        </p>
      </main>
    );
  }

  if (!circle) notFound();

  return (
    <main className="px-4 py-6">
      <CategoryChip label={circle.kind} />
      <h1 className="mt-1 text-xl font-bold">{circle.name}</h1>
      <div className="mt-3">
        <SaveButton
          table="circle_saves"
          idColumn="circle_id"
          entityId={circle.id}
          loginPath={`/circles/${circle.id}`}
        />
      </div>
      <div className="mt-4">
        <ImageSlider
          urls={circle.images.map((image) => image.url)}
          alt={circle.name}
        />
      </div>
      {circle.description ? (
        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
          {circle.description}
        </p>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">詳細文はまだありません。</p>
      )}

      <h2 className="mt-8 text-sm font-semibold">案内</h2>
      <dl className="mt-1 divide-y divide-zinc-200 dark:divide-zinc-800">
        <InfoRow label="種類" value={circle.kind} />
        <InfoRow label="市" value={circle.region} />
        <InfoRow label="ジャンル" value={circle.genre} />
        <InfoRow label="活動場所" value={circle.address} />
        <InfoRow label="代表" value={circle.representative} />
        <InfoRow label="電話" value={circle.phone} />
        <InfoRow label="メール" value={circle.email} />
        <InfoLink label="HP" href={circle.website_url} />
        <SnsIconLinks
          urls={{
            sns_instagram: circle.sns_instagram,
            sns_x: circle.sns_x,
            sns_facebook: circle.sns_facebook,
            sns_youtube: circle.sns_youtube,
            sns_tiktok: circle.sns_tiktok,
            sns_line: circle.sns_line,
          }}
        />
      </dl>
      <PdfLinks files={circle.files} />

      <div className="mt-8 flex flex-col items-center gap-3">
        <BackLink href="/circles">戻る</BackLink>
        <OwnerEditLink href={`/circles/${circle.id}/edit`} createdBy={circle.created_by} />
      </div>
    </main>
  );
}
