import { isMissingCoordColumn } from "@/lib/geo";
import { createSupabaseClient } from "@/lib/supabase";
import { sortedAttachments, type Attachment } from "@/lib/files";
import { parseLabels } from "@/lib/labels";

export const VENUE_KINDS = [
  "ギャラリー",
  "レンタルギャラリー",
  "美術館・博物館",
  "画材・文具",
  "スタジオ・工房",
  "公共施設",
  "その他",
] as const;

export type VenueKind = (typeof VENUE_KINDS)[number];

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
  lat?: number | null;
  lng?: number | null;
  kind?: string[];
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
  sns_line?: string | null;
  created_by?: string | null;
};

export type VenueWithImages = VenueRow & {
  images: VenueImage[];
  files: Attachment[];
};

function sortedImages(images: VenueImage[] | null) {
  return [...(images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

const VENUE_LIST_COLUMNS =
  "id, name, address, region, kind, lat, lng, created_by, venue_images(id, url, sort_order)";

const VENUE_LIST_COLUMNS_NO_COORDS =
  "id, name, address, region, kind, created_by, venue_images(id, url, sort_order)";

const VENUE_LIST_COLUMNS_FALLBACK =
  "id, name, address, region, created_by, venue_images(id, url, sort_order)";

const VENUE_DETAIL_COLUMNS =
  "id, name, description, address, region, kind, phone, hours_text, holiday_text, fee_text, access_transit, access_car, parking_text, payment_text, website_url, sns_instagram, sns_x, sns_line, created_by, venue_images(id, url, sort_order), venue_files(id, url, label, sort_order)";

const VENUE_DETAIL_COLUMNS_NO_FILES =
  "id, name, description, address, region, kind, phone, hours_text, holiday_text, fee_text, access_transit, access_car, parking_text, payment_text, website_url, sns_instagram, sns_x, sns_line, created_by, venue_images(id, url, sort_order)";

const VENUE_DETAIL_COLUMNS_FALLBACK =
  "id, name, description, address, region, phone, hours_text, holiday_text, fee_text, access_transit, access_car, parking_text, payment_text, website_url, sns_instagram, sns_x, sns_line, created_by, venue_images(id, url, sort_order)";

function toVenue(
  row: VenueRow & {
    venue_images: VenueImage[] | null;
    venue_files?: Attachment[] | null;
  },
): VenueWithImages {
  return {
    ...row,
    kind: parseLabels(row.kind),
    images: sortedImages(row.venue_images),
    files: sortedAttachments(row.venue_files),
  };
}

async function orderVenues(columns: string) {
  const supabase = createSupabaseClient();
  const select = () => supabase.from("venues").select(columns);
  let { data, error } = await select().order("updated_at", { ascending: false });
  if (error) {
    ({ data, error } = await select().order("created_at", { ascending: false }));
  }
  if (error) {
    ({ data, error } = await select().order("name"));
  }
  return { data, error };
}

export async function getVenues() {
  let { data, error } = await orderVenues(VENUE_LIST_COLUMNS);
  if (error && isMissingCoordColumn(error.message)) {
    ({ data, error } = await orderVenues(VENUE_LIST_COLUMNS_NO_COORDS));
  }
  if (error) {
    ({ data, error } = await orderVenues(VENUE_LIST_COLUMNS_FALLBACK));
  }

  if (error) return { venues: [] as VenueWithImages[], error };

  const venues = (
    (data ?? []) as unknown as (VenueRow & { venue_images: VenueImage[] | null })[]
  ).map(toVenue);

  return { venues, error: null };
}

export async function getVenue(id: string) {
  const supabase = createSupabaseClient();
  let { data, error } = await supabase
    .from("venues")
    .select(VENUE_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    ({ data, error } = await supabase
      .from("venues")
      .select(VENUE_DETAIL_COLUMNS_NO_FILES)
      .eq("id", id)
      .maybeSingle());
  }
  if (error) {
    ({ data, error } = await supabase
      .from("venues")
      .select(VENUE_DETAIL_COLUMNS_FALLBACK)
      .eq("id", id)
      .maybeSingle());
  }

  if (error) return { venue: null, error };
  if (!data) return { venue: null, error: null };

  return {
    venue: toVenue(
      data as unknown as VenueRow & {
        venue_images: VenueImage[] | null;
        venue_files?: Attachment[] | null;
      },
    ),
    error: null,
  };
}
