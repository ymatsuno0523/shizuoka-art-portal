import { createSupabaseClient } from "@/lib/supabase";

export type EventImage = {
  id: string;
  url: string;
  sort_order: number | null;
};

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  venue_id: string | null;
  location_text: string | null;
  region: string | null;
  genre: string | null;
  medium: string | null;
  created_by?: string | null;
};

export type EventWithPlace = EventRow & {
  placeLabel: string;
  images: EventImage[];
};

function sortedImages(images: EventImage[] | null) {
  return [...(images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

function placeLabel(
  event: Pick<EventRow, "venue_id" | "location_text" | "region">,
  venueName?: string | null,
) {
  if (event.venue_id && venueName) return venueName;
  if (event.location_text) return event.location_text;
  if (event.region) return event.region;
  return "場所未設定";
}

async function venueNamesById(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, string>;

  const supabase = createSupabaseClient();
  const { data } = await supabase.from("venues").select("id, name").in("id", ids);

  return Object.fromEntries((data ?? []).map((venue) => [venue.id, venue.name]));
}

export async function getEvents() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, event_images(id, url, sort_order)")
    .order("start_at", { ascending: true });

  if (error) return { events: [] as EventWithPlace[], error };

  const rows = (data ?? []) as (EventRow & { event_images: EventImage[] | null })[];
  const names = await venueNamesById(
    [...new Set(rows.map((event) => event.venue_id).filter(Boolean))] as string[],
  );

  return {
    events: rows.map((event) => ({
      ...event,
      placeLabel: placeLabel(event, event.venue_id ? names[event.venue_id] : null),
      images: sortedImages(event.event_images),
    })),
    error: null,
  };
}

export async function getEvent(id: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, event_images(id, url, sort_order)")
    .eq("id", id)
    .maybeSingle();

  if (error) return { event: null, error };
  if (!data) return { event: null, error: null };

  const event = data as EventRow & { event_images: EventImage[] | null };
  const names = await venueNamesById(event.venue_id ? [event.venue_id] : []);

  return {
    event: {
      ...event,
      placeLabel: placeLabel(event, event.venue_id ? names[event.venue_id] : null),
      images: sortedImages(event.event_images),
    } satisfies EventWithPlace,
    error: null,
  };
}

export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
