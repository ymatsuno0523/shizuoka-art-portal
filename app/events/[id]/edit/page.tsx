import EventForm from "@/app/components/EventForm";
import { getEvent } from "@/lib/events";
import { createSupabaseClient } from "@/lib/supabase";
import type { OrgOption, VenueOption } from "@/lib/event-form";
import { replacedSlugPath } from "@/lib/slug";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
  const canonical = replacedSlugPath("events", id, event.slug, "/edit");
  if (canonical) redirect(canonical);

  const supabase = createSupabaseClient();
  const [{ data: venues }, { data: orgs }] = await Promise.all([
    supabase.from("venues").select("id, name, region").order("name"),
    supabase.from("circles").select("id, name, kind").order("name"),
  ]);

  return (
    <EventForm
      venues={(venues ?? []) as VenueOption[]}
      orgs={(orgs ?? []) as OrgOption[]}
      event={event}
    />
  );
}
