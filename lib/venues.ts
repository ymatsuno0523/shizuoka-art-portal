import { createSupabaseClient } from "@/lib/supabase";

export type VenueImage = {
  id: string;
  url: string;
  sort_order: number | null;
};

export type VenueRow = {
  id: string;
  name: string;
  description?: string | null;
  address: string | null;
  region: string | null;
  phone?: string | null;
  hours_text?: string | null;
  holiday_text?: string | null;
  fee_text?: string | null;
  access_transit?: string | null;
  access_car?: string | null;
  parking_text?: string | null;
  payment_text?: string | null;
  website_url?: string | null;
  sns_instagram?: string | null;
  sns_x?: string | null;
  sns_facebook?: string | null;
  sns_youtube?: string | null;
  sns_tiktok?: string | null;
  sns_line?: string | null;
  created_by?: string | null;
};

export type VenueWithImages = VenueRow & {
  images: VenueImage[];
};

function sortedImages(images: VenueImage[] | null) {
  return [...(images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

const VENUE_LIST_COLUMNS =
  "id, name, address, region, created_by, venue_images(id, url, sort_order)";

const VENUE_DETAIL_COLUMNS =
  "id, name, description, address, region, phone, hours_text, holiday_text, fee_text, access_transit, access_car, parking_text, payment_text, website_url, sns_instagram, sns_x, sns_facebook, sns_youtube, sns_tiktok, sns_line, created_by, venue_images(id, url, sort_order)";

function toVenue(
  row: VenueRow & { venue_images: VenueImage[] | null },
): VenueWithImages {
  return {
    ...row,
    images: sortedImages(row.venue_images),
  };
}

export async function getVenues() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_LIST_COLUMNS)
    .order("name");

  if (error) return { venues: [] as VenueWithImages[], error };

  const venues = (
    (data ?? []) as (VenueRow & { venue_images: VenueImage[] | null })[]
  ).map(toVenue);

  return { venues, error: null };
}

export async function getVenue(id: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("venues")
    .select(VENUE_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) return { venue: null, error };
  if (!data) return { venue: null, error: null };

  return {
    venue: toVenue(data as VenueRow & { venue_images: VenueImage[] | null }),
    error: null,
  };
}
