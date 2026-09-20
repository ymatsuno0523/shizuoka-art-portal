import EventForm from "@/app/components/EventForm";
import { getEvent } from "@/lib/events";
import { createSupabaseClient } from "@/lib/supabase";
import type { VenueOption } from "@/lib/event-form";
import { notFound } from "next/navigation";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { event, error } = await getEvent(id);
  if (error) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-red-600">{error.message}</p>
      </main>
    );
  }
  if (!event) notFound();

  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("venues")
    .select("id, name, region")
    .order("name");

  return <EventForm venues={(data ?? []) as VenueOption[]} event={event} />;
}
