import { createSupabaseClient } from "@/lib/supabase";

export type VenueRow = {
  id: string;
  name: string;
  address: string | null;
  region: string | null;
  created_by?: string | null;
};

export type VenueWithImages = VenueRow & {
  imageUrls: string[];
};

type VenueImageRow = {
  url: string;
  sort_order: number | null;
};

function sortedUrls(images: VenueImageRow[] | null) {
  return [...(images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((image) => image.url);
}

export async function getVenues() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, address, region, created_by, venue_images(url, sort_order)")
    .order("name");

  if (error) return { venues: [] as VenueWithImages[], error };

  const venues = ((data ?? []) as (VenueRow & { venue_images: VenueImageRow[] | null })[]).map(
    (venue) => ({
      id: venue.id,
      name: venue.name,
      address: venue.address,
      region: venue.region,
      created_by: venue.created_by,
      imageUrls: sortedUrls(venue.venue_images),
    }),
  );

  return { venues, error: null };
}

export async function getVenue(id: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, address, region, created_by, venue_images(url, sort_order)")
    .eq("id", id)
    .maybeSingle();

  if (error) return { venue: null, error };
  if (!data) return { venue: null, error: null };

  const row = data as VenueRow & { venue_images: VenueImageRow[] | null };
  return {
    venue: {
      id: row.id,
      name: row.name,
      address: row.address,
      region: row.region,
      created_by: row.created_by,
      imageUrls: sortedUrls(row.venue_images),
    } satisfies VenueWithImages,
    error: null,
  };
}
