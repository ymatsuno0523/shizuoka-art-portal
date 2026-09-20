import VenueForm from "@/app/components/VenueForm";
import { getVenue } from "@/lib/venues";
import { notFound } from "next/navigation";

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
  return <VenueForm venue={venue} />;
}
