import type { EventRow } from "@/lib/events";
import { REGIONS, type VenueOption } from "@/lib/event-form";

export function initialPlaceMode(event: EventRow | undefined, venues: VenueOption[]) {
  if (event?.venue_id) return "venue" as const;
  if (event?.location_text) return "text" as const;
  return venues.length > 0 ? ("venue" as const) : ("text" as const);
}

export function regionOptions(current?: string | null) {
  if (current && !REGIONS.includes(current as (typeof REGIONS)[number])) {
    return [current, ...REGIONS];
  }
  return [...REGIONS];
}
