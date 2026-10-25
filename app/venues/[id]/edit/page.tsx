import type { Metadata } from "next";
import VenueForm from "@/app/components/VenueForm";
import { getVenue } from "@/lib/venues";
import { replacedSlugPath } from "@/lib/slug";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { venue } = await getVenue(id);
  if (!venue) return { title: "施設を編集" };
  return { title: `${venue.name}を編集` };
}

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { venue, error } = await getVenue(id);
  if (error) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-red-600">{error.message}</p>
      </main>
    );
  }
  if (!venue) notFound();
  const canonical = replacedSlugPath("venues", id, venue.slug, "/edit");
  if (canonical) redirect(canonical);
  return <VenueForm venue={venue} />;
}
