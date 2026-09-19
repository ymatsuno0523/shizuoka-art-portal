import EventForm from "@/app/components/EventForm";
import { createSupabaseClient } from "@/lib/supabase";
import type { VenueOption } from "@/lib/event-form";

export default async function NewEventPage() {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("venues")
    .select("id, name, region")
    .order("name");

  return <EventForm venues={(data ?? []) as VenueOption[]} />;
}
