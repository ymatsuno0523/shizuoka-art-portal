import { createSupabaseClient } from "@/lib/supabase";

export const ORG_KINDS = [
  "サークル",
  "教室・スクール",
  "企業・スタジオ",
  "その他",
] as const;

export type OrgKind = (typeof ORG_KINDS)[number];

export type CircleImage = {
  id: string;
  url: string;
  sort_order: number | null;
};

export type CircleRow = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  region: string | null;
  genre: string | null;
  kind: string | null;
  representative?: string | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  sns_instagram?: string | null;
  sns_x?: string | null;
  sns_facebook?: string | null;
  sns_youtube?: string | null;
  sns_tiktok?: string | null;
  sns_line?: string | null;
  created_by?: string | null;
};

export type CircleWithImages = CircleRow & {
  images: CircleImage[];
};

function sortedImages(images: CircleImage[] | null) {
  return [...(images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

const CIRCLE_LIST_COLUMNS =
  "id, name, description, address, region, genre, kind, created_by, circle_images(id, url, sort_order)";

const CIRCLE_DETAIL_COLUMNS =
  "id, name, description, address, region, genre, kind, representative, phone, email, website_url, sns_instagram, sns_x, sns_facebook, sns_youtube, sns_tiktok, sns_line, created_by, circle_images(id, url, sort_order)";

function toCircle(
  row: CircleRow & { circle_images: CircleImage[] | null },
): CircleWithImages {
  return {
    ...row,
    images: sortedImages(row.circle_images),
  };
}

export async function getCircles() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("circles")
    .select(CIRCLE_LIST_COLUMNS)
    .order("name");

  if (error) return { circles: [] as CircleWithImages[], error };

  const circles = (
    (data ?? []) as (CircleRow & { circle_images: CircleImage[] | null })[]
  ).map(toCircle);

  return { circles, error: null };
}

export async function getCircle(id: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("circles")
    .select(CIRCLE_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) return { circle: null, error };
  if (!data) return { circle: null, error: null };

  return {
    circle: toCircle(data as CircleRow & { circle_images: CircleImage[] | null }),
    error: null,
  };
}
