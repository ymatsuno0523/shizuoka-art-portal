import { createSupabaseClient } from "@/lib/supabase";
import { sortedAttachments, type Attachment } from "@/lib/files";
import { parseLabels } from "@/lib/labels";
import { isMissingSlugColumn, isUuid, withoutSlugColumn } from "@/lib/slug";

export const ORG_KINDS = [
  "サークル",
  "教室・スクール",
  "企業・事務所",
  "行政・財団",
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
  slug?: string | null;
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
  "id, slug, name, description, address, region, genre, kind, created_by, circle_images(id, url, sort_order)";

const CIRCLE_DETAIL_COLUMNS =
  "id, slug, name, description, address, region, genre, kind, representative, phone, email, website_url, sns_instagram, sns_x, sns_line, created_by, circle_images(id, url, sort_order), circle_files(id, url, label, sort_order)";

const CIRCLE_DETAIL_COLUMNS_FALLBACK =
  "id, slug, name, description, address, region, genre, kind, representative, phone, email, website_url, sns_instagram, sns_x, sns_line, created_by, circle_images(id, url, sort_order)";

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
  const load = async (columns: string) => {
    const select = () => supabase.from("circles").select(columns);
    let result = await select().order("updated_at", { ascending: false });
    if (result.error) {
      result = await select().order("created_at", { ascending: false });
    }
    if (result.error) {
      result = await select().order("name");
    }
    return result;
  };

  let columns = CIRCLE_LIST_COLUMNS;
  let { data, error } = await load(columns);
  if (error && isMissingSlugColumn(error.message)) {
    columns = withoutSlugColumn(columns);
    ({ data, error } = await load(columns));
  }

  if (error) return { circles: [] as CircleWithImages[], error };

  const circles = (
    (data ?? []) as unknown as (CircleRow & { circle_images: CircleImage[] | null })[]
  ).map(toCircle);

  return { circles, error: null };
}

async function queryCircle(columns: string, key: string) {
  const supabase = createSupabaseClient();
  const column = isUuid(key) ? "id" : "slug";
  let result = await supabase.from("circles").select(columns).eq(column, key).maybeSingle();
  if (result.error && isMissingSlugColumn(result.error.message) && column === "id") {
    result = await supabase
      .from("circles")
      .select(withoutSlugColumn(columns))
      .eq("id", key)
      .maybeSingle();
  }
  return result;
}

export async function getCircle(id: string) {
  let { data, error } = await queryCircle(CIRCLE_DETAIL_COLUMNS, id);
  if (error) {
    ({ data, error } = await queryCircle(CIRCLE_DETAIL_COLUMNS_FALLBACK, id));
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
