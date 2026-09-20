import { AREA_CITIES } from "@/lib/event-form";

export const AREA_ORDER = ["西部", "中部", "東部"] as const;

export type SearchParamValue = string | string[] | undefined;

export function buildListHref(
  path: string,
  params: Record<string, string | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function parseFilterValues(
  value: SearchParamValue,
  options: readonly string[],
) {
  const parts = Array.isArray(value)
    ? value.flatMap((item) => item.split(","))
    : value
      ? value.split(",")
      : [];
  const allowed = new Set(options);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const item = part.trim();
    if (!item || !allowed.has(item) || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
}

export function joinFilters(values: string[], options: readonly string[]) {
  const selected = new Set(values);
  const ordered = options.filter((option) => selected.has(option));
  if (ordered.length === 0 || ordered.length === options.length) return undefined;
  return ordered.join(",");
}

export function matchesFilter(
  value: string | null | undefined,
  selected: string[],
) {
  if (selected.length === 0) return true;
  return Boolean(value && selected.includes(value));
}

export function summarizeRegions(selected: string[]) {
  if (selected.length === 0) return "";
  const labels: string[] = [];
  const covered = new Set<string>();
  for (const area of AREA_ORDER) {
    const cities = AREA_CITIES[area];
    if (cities.every((city) => selected.includes(city))) {
      labels.push(area);
      cities.forEach((city) => covered.add(city));
    }
  }
  for (const city of selected) {
    if (!covered.has(city)) labels.push(city);
  }
  return labels.join("、");
}

export function toggleValue(values: string[], option: string) {
  return values.includes(option)
    ? values.filter((value) => value !== option)
    : [...values, option];
}

export function toggleArea(values: string[], cities: readonly string[]) {
  const citySet = new Set<string>(cities);
  const allOn = cities.every((city) => values.includes(city));
  if (allOn) return values.filter((value) => !citySet.has(value));
  return [...new Set([...values, ...cities])];
}
