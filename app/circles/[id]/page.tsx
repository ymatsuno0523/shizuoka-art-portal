import { notFound } from "next/navigation";
import BackLink from "@/app/components/BackLink";
import ImageSlider from "@/app/components/ImageSlider";
import OwnerEditLink from "@/app/components/OwnerEditLink";
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
      </main>
    );
  }

  if (!circle) notFound();

  return (
    <main className="px-4 py-6">
      <div>
        <ImageSlider
          urls={circle.images.map((image) => image.url)}
          alt={circle.name}
        />
      </div>
      <h1 className="mt-4 text-xl font-bold">{circle.name}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {circle.region}
        {circle.genre ? ` · ${circle.genre}` : ""}
        {circle.address ? ` · ${circle.address}` : ""}
      </p>
      {circle.description ? (
        <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
          {circle.description}
        </p>
      ) : null}
      <OwnerEditLink href={`/circles/${circle.id}/edit`} createdBy={circle.created_by} />
      <div className="mt-8">
        <BackLink href="/circles">← 戻る</BackLink>
      </div>
    </main>
  );
}
