export const MAX_LABELS = 2;

export function parseLabels(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export function joinLabels(value: unknown) {
  return parseLabels(value).join("、") || null;
}

export function withUnknownLabels(options: readonly string[], current: string[]) {
  const known = new Set(options);
  const extra = current.filter((item) => !known.has(item));
  return extra.length > 0 ? [...extra, ...options] : [...options];
}

export function toggleClosedLabel(selected: string[], option: string, max = MAX_LABELS) {
  if (selected.includes(option)) {
    return selected.filter((item) => item !== option);
  }
  if (selected.length >= max) return selected;
  return [...selected, option];
}

export function matchesAnyFilter(value: unknown, selected: string[]) {
  if (selected.length === 0) return true;
  return parseLabels(value).some((item) => selected.includes(item));
}
