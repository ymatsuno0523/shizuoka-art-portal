import type { EventRow } from "@/lib/events";
import { REGIONS, type OrgOption, type VenueOption } from "@/lib/event-form";
import { ORG_KINDS } from "@/lib/circles";
import { VENUE_KINDS } from "@/lib/venues";

export function initialPlaceMode(event: EventRow | undefined, venues: VenueOption[]) {
  if (event?.venue_id) return "venue" as const;
  if (event?.location_text) return "text" as const;
  return venues.length > 0 ? ("venue" as const) : ("text" as const);
}

export function initialOrgMode(event: EventRow | undefined, orgs: OrgOption[]) {
  if (event?.circle_id) return "org" as const;
  if (event?.organizer) return "text" as const;
  return orgs.length > 0 ? ("org" as const) : ("text" as const);
}

export function orgKindOptions(current?: string | null) {
  if (current && !ORG_KINDS.includes(current as (typeof ORG_KINDS)[number])) {
    return [current, ...ORG_KINDS];
  }
  return [...ORG_KINDS];
}

export function venueKindOptions(current?: string | null) {
  if (current && !VENUE_KINDS.includes(current as (typeof VENUE_KINDS)[number])) {
    return [current, ...VENUE_KINDS];
  }
  return [...VENUE_KINDS];
}

export function regionOptions(current?: string | null) {
  if (current && !REGIONS.includes(current as (typeof REGIONS)[number])) {
    return [current, ...REGIONS];
  }
  return [...REGIONS];
}
