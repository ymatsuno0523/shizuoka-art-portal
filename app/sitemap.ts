import type { MetadataRoute } from "next";
import { createSupabaseClient } from "@/lib/supabase";
import { contentHref } from "@/lib/slug";

export const revalidate = 86400;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://shizuoka-art-portal.jp";

type SlugRow = {
  id: string;
  slug?: string | null;
  updated_at?: string | null;
};

async function listRows(table: "events" | "venues" | "circles") {
  const supabase = createSupabaseClient();
  const withMeta = await supabase
    .from(table)
    .select("id, slug, updated_at")
    .order("updated_at", { ascending: false });
  if (!withMeta.error) return (withMeta.data ?? []) as SlugRow[];

  const withSlug = await supabase.from(table).select("id, slug");
  if (!withSlug.error) {
    return (withSlug.data ?? []).map((row) => ({
      id: row.id as string,
      slug: (row as { slug?: string | null }).slug ?? null,
      updated_at: null,
    }));
  }

  const idsOnly = await supabase.from(table).select("id");
  if (idsOnly.error) return [] as SlugRow[];
  return (idsOnly.data ?? []).map((row) => ({
    id: row.id as string,
    slug: null,
    updated_at: null,
  }));
}

function detailEntries(
  section: "events" | "venues" | "circles",
  rows: SlugRow[],
  priority: number,
): MetadataRoute.Sitemap {
  return rows.map((row) => ({
    url: `${SITE_URL}${contentHref(section, row)}`,
    lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
    changeFrequency: "weekly" as const,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, venues, circles] = await Promise.all([
    listRows("events"),
    listRows("venues"),
    listRows("circles"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/events`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/venues`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/circles`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/mypage/about`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/mypage/help`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/mypage/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/mypage/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/mypage/contact`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/mypage/news`,
      changeFrequency: "weekly",
      priority: 0.3,
    },
  ];

  return [
    ...staticPages,
    ...detailEntries("events", events, 0.7),
    ...detailEntries("venues", venues, 0.6),
    ...detailEntries("circles", circles, 0.6),
  ];
}
