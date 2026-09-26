export const CATEGORIES = [
  "展示",
  "体験・ワークショップ",
  "即売会・マルシェ",
  "トーク・パフォーマンス",
  "交流・オフ会",
  "公募・レジデンス",
  "その他",
] as const;

export type EventCategory = (typeof CATEGORIES)[number];

export function categoryOptions(current?: string | null) {
  if (current && !CATEGORIES.includes(current as EventCategory)) {
    return [current, ...CATEGORIES];
  }
  return [...CATEGORIES];
}

export const REGIONS = [
  "静岡市",
  "藤枝市",
  "焼津市",
  "島田市",
  "牧之原市",
  "浜松市",
  "磐田市",
  "掛川市",
  "袋井市",
  "湖西市",
  "菊川市",
  "御前崎市",
  "沼津市",
  "三島市",
  "富士市",
  "富士宮市",
  "御殿場市",
  "裾野市",
  "熱海市",
  "伊東市",
  "伊豆市",
  "伊豆の国市",
  "下田市",
  "その他",
] as const;

export const AREA_CITIES = {
  中部: ["静岡市", "藤枝市", "焼津市", "島田市", "牧之原市"],
  西部: ["浜松市", "磐田市", "掛川市", "袋井市", "湖西市", "菊川市", "御前崎市"],
  東部: [
    "沼津市",
    "三島市",
    "富士市",
    "富士宮市",
    "御殿場市",
    "裾野市",
    "熱海市",
    "伊東市",
    "伊豆市",
    "伊豆の国市",
    "下田市",
  ],
} as const;

export type VenueOption = {
  id: string;
  name: string;
  region: string | null;
  address?: string | null;
};

export type OrgOption = {
  id: string;
  name: string;
  kind: string | string[] | null;
};

export function toDateInputValue(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
