import { notFound, redirect } from "next/navigation";
import BackLink from "@/app/components/BackLink";
import { CategoryChips } from "@/app/components/CategoryChip";
import ImageSlider from "@/app/components/ImageSlider";
import { InfoLink, InfoRow } from "@/app/components/InfoRow";
import OwnerActions from "@/app/components/OwnerActions";
import PdfLinks from "@/app/components/PdfLinks";
import SaveButton from "@/app/components/SaveButton";
import SnsIconLinks from "@/app/components/SnsIconLinks";
import { getCircle } from "@/lib/circles";
import { joinLabels } from "@/lib/labels";
import { contentHref, replacedSlugPath } from "@/lib/slug";

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
  const canonical = replacedSlugPath("circles", id, circle.slug);
  if (canonical) redirect(canonical);
  const path = contentHref("circles", circle);

  return (
    <main className="px-4 py-6">
      <CategoryChips labels={circle.kind} />
      <h1 className="mt-1 text-xl font-bold">{circle.name}</h1>
      <div className="mt-3">
        <SaveButton
          table="circle_saves"
          idColumn="circle_id"
          entityId={circle.id}
          loginPath={path}
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

      <dl className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        <InfoRow label="種類" value={joinLabels(circle.kind)} />
        <InfoRow label="地域" value={circle.address?.trim() ? null : circle.region} />
        <InfoRow label="ジャンル" value={circle.genre} />
        <InfoRow label="活動場所" value={circle.address} />
        <InfoRow label="代表" value={circle.representative} />
        <InfoRow label="電話" value={circle.phone} />
        <InfoRow label="メール" value={circle.email} />
        <InfoLink label="HP" href={circle.website_url} />
        <PdfLinks files={circle.files} />
        <SnsIconLinks
          urls={{
            sns_instagram: circle.sns_instagram,
            sns_x: circle.sns_x,
            sns_line: circle.sns_line,
          }}
        />
      </dl>

      <div className="mt-8 flex flex-col items-center gap-3">
        <BackLink href="/circles">戻る</BackLink>
        <OwnerActions
          kind="circle"
          id={circle.id}
          editHref={`${path}/edit`}
          createdBy={circle.created_by}
          listHref="/circles"
        />
      </div>
    </main>
  );
}
