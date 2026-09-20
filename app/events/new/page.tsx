import EventForm from "@/app/components/EventForm";
import { createSupabaseClient } from "@/lib/supabase";
import type { OrgOption, VenueOption } from "@/lib/event-form";

export default async function NewEventPage() {
  const supabase = createSupabaseClient();
  const [{ data: venues }, { data: orgs }] = await Promise.all([
    supabase.from("venues").select("id, name, region").order("name"),
    supabase.from("circles").select("id, name, kind").order("name"),
  ]);

  return (
    <EventForm
      venues={(venues ?? []) as VenueOption[]}
      orgs={(orgs ?? []) as OrgOption[]}
    />
  );
}
