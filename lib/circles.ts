import { createSupabaseClient } from "@/lib/supabase";
import { sortedAttachments, type Attachment } from "@/lib/files";
import { parseLabels } from "@/lib/labels";

export const ORG_KINDS = [
  "サークル",
  "教室・スクール",
  "企業・事務所",
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
  kind: string[];
  representative?: string | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  sns_instagram?: string | null;
  sns_x?: string | null;
  sns_line?: string | null;
  created_by?: string | null;
};

export type CircleWithImages = CircleRow & {
  images: CircleImage[];
  files: Attachment[];
};

function sortedImages(images: CircleImage[] | null) {
  return [...(images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

const CIRCLE_LIST_COLUMNS =
  "id, name, description, address, region, genre, kind, created_by, circle_images(id, url, sort_order)";

const CIRCLE_DETAIL_COLUMNS =
  "id, name, description, address, region, genre, kind, representative, phone, email, website_url, sns_instagram, sns_x, sns_line, created_by, circle_images(id, url, sort_order), circle_files(id, url, label, sort_order)";

const CIRCLE_DETAIL_COLUMNS_FALLBACK =
  "id, name, description, address, region, genre, kind, representative, phone, email, website_url, sns_instagram, sns_x, sns_line, created_by, circle_images(id, url, sort_order)";

function toCircle(
  row: CircleRow & {
    circle_images: CircleImage[] | null;
    circle_files?: Attachment[] | null;
  },
): CircleWithImages {
  return {
    ...row,
    kind: parseLabels(row.kind),
    images: sortedImages(row.circle_images),
    files: sortedAttachments(row.circle_files),
  };
}

export async function getCircles() {
  const supabase = createSupabaseClient();
  const select = () => supabase.from("circles").select(CIRCLE_LIST_COLUMNS);
  let { data, error } = await select().order("updated_at", { ascending: false });
  if (error) {
    ({ data, error } = await select().order("created_at", { ascending: false }));
  }
  if (error) {
    ({ data, error } = await select().order("name"));
  }

  if (error) return { circles: [] as CircleWithImages[], error };

  const circles = (
    (data ?? []) as (CircleRow & { circle_images: CircleImage[] | null })[]
  ).map(toCircle);

  return { circles, error: null };
}

export async function getCircle(id: string) {
  const supabase = createSupabaseClient();
  let { data, error } = await supabase
    .from("circles")
    .select(CIRCLE_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    ({ data, error } = await supabase
      .from("circles")
      .select(CIRCLE_DETAIL_COLUMNS_FALLBACK)
      .eq("id", id)
      .maybeSingle());
  }

  if (error) return { circle: null, error };
  if (!data) return { circle: null, error: null };

  return {
    circle: toCircle(
      data as unknown as CircleRow & {
        circle_images: CircleImage[] | null;
        circle_files?: Attachment[] | null;
      },
    ),
    error: null,
  };
}
