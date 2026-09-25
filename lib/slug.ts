const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function parseSlug(value: string) {
  const slug = value.trim().toLowerCase();
  if (!slug) return { slug: null, error: null };
  if (slug === "new" || isUuid(slug) || slug.length > 60 || !SLUG_PATTERN.test(slug)) {
    return {
      slug: null,
      error: "共有用URLは半角英数字とハイフンで入れてください。例: sample-name",
    };
  }
  return { slug, error: null };
}

export function isMissingSlugColumn(message: string) {
  return /schema cache|column/i.test(message) && /\bslug\b/.test(message);
}

export function withoutSlugColumn(columns: string) {
  return columns.replace(/\bslug,\s*/g, "").replace(/,\s*slug\b/g, "");
}

export function withoutSlug<T extends { slug?: string | null }>(payload: T) {
  const { slug: _slug, ...rest } = payload;
  return rest;
}

export function slugSaveHint(message: string) {
  if (/duplicate key|unique constraint/i.test(message)) {
    return "この共有用URLはすでに使われています。";
  }
  if (isMissingSlugColumn(message)) {
    return `${message} supabase/slugs.sql を実行したか確認してください。`;
  }
  return null;
}

export function contentHref(
  section: "events" | "venues" | "circles",
  row: { id: string; slug?: string | null },
  suffix = "",
) {
  return `/${section}/${row.slug?.trim() || row.id}${suffix}`;
}

export function replacedSlugPath(
  section: "events" | "venues" | "circles",
  key: string,
  slug?: string | null,
  suffix = "",
) {
  const next = slug?.trim();
  if (!next || key === next) return null;
  return contentHref(section, { id: key, slug: next }, suffix);
}
