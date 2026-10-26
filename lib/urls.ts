export function externalHref(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^(mailto|tel):/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  const withHost = raw.replace(/^(https?:)\/(?!\/)/i, "$1//");
  if (/^https?:\/\//i.test(withHost)) return withHost;
  return `https://${withHost.replace(/^\/+/, "")}`;
}
