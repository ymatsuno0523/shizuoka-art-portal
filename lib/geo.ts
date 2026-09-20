export type MapPin = {
  id: string;
  title: string;
  href: string;
  subtitle: string;
  lat: number;
  lng: number;
};

export const SHIZUOKA_CENTER = { lat: 34.98, lng: 138.38 };

const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  静岡市: { lat: 34.9756, lng: 138.3828 },
  浜松市: { lat: 34.7108, lng: 137.7261 },
  沼津市: { lat: 35.0956, lng: 138.8634 },
  富士市: { lat: 35.1614, lng: 138.6764 },
  富士宮市: { lat: 35.2222, lng: 138.6217 },
  藤枝市: { lat: 34.8675, lng: 138.2575 },
  焼津市: { lat: 34.867, lng: 138.323 },
  島田市: { lat: 34.8364, lng: 138.1761 },
  磐田市: { lat: 34.7181, lng: 137.8514 },
  掛川市: { lat: 34.7686, lng: 138.0153 },
  袋井市: { lat: 34.7503, lng: 137.925 },
  御殿場市: { lat: 35.3086, lng: 138.9347 },
  裾野市: { lat: 35.174, lng: 138.907 },
  三島市: { lat: 35.1185, lng: 138.9185 },
  湖西市: { lat: 34.7186, lng: 137.5317 },
  菊川市: { lat: 34.7578, lng: 138.0842 },
  御前崎市: { lat: 34.638, lng: 138.128 },
  牧之原市: { lat: 34.74, lng: 138.2247 },
  熱海市: { lat: 35.096, lng: 139.0715 },
  伊東市: { lat: 34.9658, lng: 139.1019 },
  下田市: { lat: 34.6794, lng: 138.9453 },
  伊豆市: { lat: 34.9767, lng: 138.9467 },
  伊豆の国市: { lat: 35.0278, lng: 138.9289 },
  その他: SHIZUOKA_CENTER,
};

function jitter(id: string, point: { lat: number; lng: number }) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return {
    lat: point.lat + (((hash % 17) - 8) * 0.004),
    lng: point.lng + ((((hash >> 4) % 17) - 8) * 0.004),
  };
}

export function pinFromRegion(
  id: string,
  region: string | null,
  extra: Omit<MapPin, "id" | "lat" | "lng">,
): MapPin {
  const base = (region && REGION_COORDS[region]) || SHIZUOKA_CENTER;
  const point = jitter(id, base);
  return { id, lat: point.lat, lng: point.lng, ...extra };
}
