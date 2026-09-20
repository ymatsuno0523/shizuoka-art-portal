import { notFound } from "next/navigation";
import BackLink from "@/app/components/BackLink";
import ImageSlider from "@/app/components/ImageSlider";
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
      </main>
    );
  }

  if (!venue) notFound();

  return (
    <main className="px-4 py-6">
      <div>
        <ImageSlider urls={venue.imageUrls} alt={venue.name} />
      </div>
      <h1 className="mt-4 text-xl font-bold">{venue.name}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {venue.region}
        {venue.address ? ` · ${venue.address}` : ""}
      </p>
      <div className="mt-8">
        <BackLink href="/venues">← 戻る</BackLink>
      </div>
    </main>
  );
}
