export const REGIONS = [
  "静岡市",
  "浜松市",
  "沼津市",
  "富士市",
  "富士宮市",
  "藤枝市",
  "焼津市",
  "島田市",
  "磐田市",
  "掛川市",
  "袋井市",
  "御殿場市",
  "その他",
] as const;

export type VenueOption = {
  id: string;
  name: string;
  region: string | null;
};

export function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string) {
  return new Date(value).toISOString();
}
