import { createSupabaseClient } from "@/lib/supabase";
import { sortedAttachments, type Attachment } from "@/lib/files";
import { parseLabels } from "@/lib/labels";
import { isMissingSlugColumn, isUuid } from "@/lib/slug";

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
  address?: string | null;
  region: string | null;
  lat?: number | null;
  lng?: number | null;
  genre: string[];
  medium: string | null;
  circle_id?: string | null;
  time_text?: string | null;
  schedule_note?: string | null;
  fee_text?: string | null;
  organizer?: string | null;
  support_text?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website_url?: string | null;
  parking_text?: string | null;
  created_by?: string | null;
  slug?: string | null;
};

export type EventWithPlace = EventRow & {
  placeLabel: string;
  organizerLabel: string | null;
  pinLat: number | null;
  pinLng: number | null;
  pinAddress: string | null;
  venueSlug: string | null;
  circleSlug: string | null;
  images: EventImage[];
  files: Attachment[];
};

type VenuePlace = {
  name: string;
  region: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  slug: string | null;
};

function pinFields(event: EventRow, venue?: VenuePlace) {
  if (event.venue_id && venue) {
    return {
      pinLat: venue.lat,
      pinLng: venue.lng,
      pinAddress: venue.address,
    };
  }
  return {
    pinLat: event.lat ?? null,
    pinLng: event.lng ?? null,
    pinAddress: event.address?.trim() || null,
  };
}

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

function organizerLabel(
  event: Pick<EventRow, "circle_id" | "organizer">,
  circleName?: string | null,
) {
  if (event.circle_id && circleName) return circleName;
  return event.organizer?.trim() || null;
}

async function venuesById(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, VenuePlace>;

  const supabase = createSupabaseClient();
  const withSlug = await supabase
    .from("venues")
    .select("id, slug, name, region, address, lat, lng")
    .in("id", ids);
  const full =
    withSlug.error && isMissingSlugColumn(withSlug.error.message)
      ? await supabase.from("venues").select("id, name, region, address, lat, lng").in("id", ids)
      : withSlug;

  if (!full.error) {
    return Object.fromEntries(
      (full.data ?? []).map((venue) => [
        venue.id,
        {
          name: venue.name,
          region: venue.region,
          address: venue.address,
          lat: venue.lat,
          lng: venue.lng,
          slug: (venue as { slug?: string | null }).slug ?? null,
        } satisfies VenuePlace,
      ]),
    );
  }

  const addressOnly = await supabase
    .from("venues")
    .select("id, name, region, address")
    .in("id", ids);
  if (!addressOnly.error) {
    return Object.fromEntries(
      (addressOnly.data ?? []).map((venue) => [
        venue.id,
        {
          name: venue.name,
          region: venue.region,
          address: venue.address,
          lat: null,
          lng: null,
          slug: null,
        } satisfies VenuePlace,
      ]),
    );
  }

  const basic = await supabase.from("venues").select("id, name, region").in("id", ids);
  return Object.fromEntries(
    (basic.data ?? []).map((venue) => [
      venue.id,
      {
        name: venue.name,
        region: venue.region,
        address: null,
        lat: null,
        lng: null,
        slug: null,
      } satisfies VenuePlace,
    ]),
  );
}

async function circlesById(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, { name: string; slug: string | null }>;

  const supabase = createSupabaseClient();
  const withSlug = await supabase.from("circles").select("id, slug, name").in("id", ids);
  const result =
    withSlug.error && isMissingSlugColumn(withSlug.error.message)
      ? await supabase.from("circles").select("id, name").in("id", ids)
      : withSlug;
  const { data } = result;

  return Object.fromEntries(
    (data ?? []).map((circle) => [
      circle.id,
      { name: circle.name, slug: (circle as { slug?: string | null }).slug ?? null },
    ]),
  );
}

export async function getEvents() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, event_images(id, url, sort_order)")
    .order("start_at", { ascending: true });

  if (error) return { events: [] as EventWithPlace[], error };

  const rows = (data ?? []) as (EventRow & { event_images: EventImage[] | null })[];
  const venues = await venuesById(
    [...new Set(rows.map((event) => event.venue_id).filter(Boolean))] as string[],
  );
  const circles = await circlesById(
    [...new Set(rows.map((event) => event.circle_id).filter(Boolean))] as string[],
  );

  return {
    events: rows.map((event) => ({
      ...event,
      genre: parseLabels(event.genre),
      region: event.region || (event.venue_id ? venues[event.venue_id]?.region ?? null : null),
      placeLabel: placeLabel(event, event.venue_id ? venues[event.venue_id]?.name : null),
      ...pinFields(event, event.venue_id ? venues[event.venue_id] : undefined),
      organizerLabel: organizerLabel(
        event,
        event.circle_id ? circles[event.circle_id]?.name : null,
      ),
      venueSlug: event.venue_id ? (venues[event.venue_id]?.slug ?? null) : null,
      circleSlug: event.circle_id ? (circles[event.circle_id]?.slug ?? null) : null,
      images: sortedImages(event.event_images),
      files: [],
    })),
    error: null,
  };
}

export async function getEvent(id: string) {
  const supabase = createSupabaseClient();
  const column = isUuid(id) ? "id" : "slug";
  let { data, error } = await supabase
    .from("events")
    .select("*, event_images(id, url, sort_order), event_files(id, url, label, sort_order)")
    .eq(column, id)
    .maybeSingle();
  if (error) {
    ({ data, error } = await supabase
      .from("events")
      .select("*, event_images(id, url, sort_order)")
      .eq(column, id)
      .maybeSingle());
  }

  if (error) return { event: null, error };
  if (!data) return { event: null, error: null };

  const event = data as EventRow & {
    event_images: EventImage[] | null;
    event_files?: Attachment[] | null;
  };
  const venues = await venuesById(event.venue_id ? [event.venue_id] : []);
  const circles = await circlesById(event.circle_id ? [event.circle_id] : []);

  return {
    event: {
      ...event,
      genre: parseLabels(event.genre),
      region: event.region || (event.venue_id ? venues[event.venue_id]?.region ?? null : null),
      placeLabel: placeLabel(event, event.venue_id ? venues[event.venue_id]?.name : null),
      ...pinFields(event, event.venue_id ? venues[event.venue_id] : undefined),
      organizerLabel: organizerLabel(
        event,
        event.circle_id ? circles[event.circle_id]?.name : null,
      ),
      venueSlug: event.venue_id ? (venues[event.venue_id]?.slug ?? null) : null,
      circleSlug: event.circle_id ? (circles[event.circle_id]?.slug ?? null) : null,
      images: sortedImages(event.event_images),
      files: sortedAttachments(event.event_files),
    } satisfies EventWithPlace,
    error: null,
  };
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

export function eventDateKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function tokyoTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function eventEndKey(event: { start_at: string; end_at: string | null }) {
  return eventDateKey(event.end_at || event.start_at);
}

export function isPastEvent(
  event: { start_at: string; end_at: string | null },
  today = tokyoTodayKey(),
) {
  return eventEndKey(event) < today;
}

export function formatEventDateRange(startAt: string, endAt?: string | null) {
  const startLabel = formatEventDate(startAt);
  if (!endAt || eventDateKey(startAt) === eventDateKey(endAt)) return startLabel;
  return `${startLabel} 〜 ${formatEventDate(endAt)}`;
}

export function sortEventsForList<T extends { start_at: string; end_at: string | null }>(
  events: T[],
) {
  const today = tokyoTodayKey();
  return [...events].sort((a, b) => {
    const aPast = isPastEvent(a, today);
    const bPast = isPastEvent(b, today);
    if (aPast !== bPast) return aPast ? 1 : -1;

    if (aPast) {
      const byEnd = eventEndKey(b).localeCompare(eventEndKey(a));
      if (byEnd !== 0) return byEnd;
      return eventDateKey(b.start_at).localeCompare(eventDateKey(a.start_at));
    }

    const aStart = eventDateKey(a.start_at);
    const bStart = eventDateKey(b.start_at);
    const aKey = aStart <= today ? `0-${eventEndKey(a)}` : `1-${aStart}`;
    const bKey = bStart <= today ? `0-${eventEndKey(b)}` : `1-${bStart}`;
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return eventDateKey(a.start_at).localeCompare(eventDateKey(b.start_at));
  });
}
