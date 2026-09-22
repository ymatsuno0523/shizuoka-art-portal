import { REGIONS } from "@/lib/event-form";

export type MapPin = {
  id: string;
  title: string;
  href: string;
  subtitle: string;
  lat: number;
  lng: number;
};

export type MapPinSource = {
  id: string;
  title: string;
  href: string;
  subtitle: string;
  lat: number | null;
  lng: number | null;
  region: string | null;
  address: string | null;
};

type GeoPoint = { lat: number; lng: number };

export const SHIZUOKA_CENTER = { lat: 34.98, lng: 138.38 };

const SHIZUOKA_BOUNDS = {
  latMin: 34.55,
  latMax: 35.7,
  lngMin: 137.4,
  lngMax: 139.25,
};

const REGION_COORDS: Record<string, GeoPoint> = {
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

const GSI_ADDRESS_SEARCH = "https://msearch.gsi.go.jp/address-search/AddressSearch";
const geocodeCache = new Map<string, GeoPoint>();

function jitter(id: string, point: GeoPoint) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return {
    lat: point.lat + (((hash % 17) - 8) * 0.004),
    lng: point.lng + ((((hash >> 4) % 17) - 8) * 0.004),
  };
}

function inShizuoka(lat: number, lng: number) {
  return (
    lat >= SHIZUOKA_BOUNDS.latMin &&
    lat <= SHIZUOKA_BOUNDS.latMax &&
    lng >= SHIZUOKA_BOUNDS.lngMin &&
    lng <= SHIZUOKA_BOUNDS.lngMax
  );
}

function coord(value: number | null) {
  return value != null && Number.isFinite(value) ? value : null;
}

export function addressQuery(address: string, region: string | null) {
  let text = address.normalize("NFKC").trim();
  if (!text) return "";
  text = text.replace(/[‐‑‒–—―ー－−]/g, "-");
  text = text.replace(/\s+/g, "");
  text = text.replace(/(\d+)丁目/g, "$1-");
  text = text.replace(/(\d+)番地の(\d+)/g, "$1-$2");
  text = text.replace(/(\d+)番地?/g, "$1-");
  text = text.replace(/(\d+)号/g, "$1");
  text = text.replace(/-+/g, "-").replace(/-$/g, "");

  if (/^(北海道|.{2,3}[都道府県])/.test(text)) return text;

  const namedCity = REGIONS.find((city) => city !== "その他" && text.includes(city));
  const city = region && region !== "その他" ? region : "";
  if (!namedCity && city) text = `${city}${text}`;
  return `静岡県${text}`;
}

export async function geocodeAddress(address: string | null, region: string | null) {
  const query = address ? addressQuery(address, region) : "";
  if (!query) return null;
  const cached = geocodeCache.get(query);
  if (cached) return cached;

  try {
    const response = await fetch(`${GSI_ADDRESS_SEARCH}?q=${encodeURIComponent(query)}`);
    if (!response.ok) return null;
    const features = (await response.json()) as {
      geometry?: { coordinates?: [number, number] };
    }[];
    for (const feature of features) {
      const [lng, lat] = feature.geometry?.coordinates ?? [];
      if (lat == null || lng == null || !inShizuoka(lat, lng)) continue;
      const point = { lat, lng };
      geocodeCache.set(query, point);
      return point;
    }
  } catch {
    return null;
  }
  return null;
}

export async function coordinatesFor(address: string | null, region: string | null) {
  const point = await geocodeAddress(address, region);
  return { lat: point?.lat ?? null, lng: point?.lng ?? null };
}

export function withoutCoords<T extends { lat?: number | null; lng?: number | null }>(payload: T) {
  const { lat: _lat, lng: _lng, ...rest } = payload;
  return rest;
}

export function isMissingCoordColumn(message: string) {
  return /schema cache|column/i.test(message) && /\blat\b|\blng\b/.test(message);
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

function pinExtras(source: MapPinSource): Omit<MapPin, "id" | "lat" | "lng"> {
  return { title: source.title, href: source.href, subtitle: source.subtitle };
}

export function pinFromSource(source: MapPinSource): MapPin {
  const lat = coord(source.lat);
  const lng = coord(source.lng);
  if (lat != null && lng != null && inShizuoka(lat, lng)) {
    return { id: source.id, lat, lng, ...pinExtras(source) };
  }
  return pinFromRegion(source.id, source.region, pinExtras(source));
}

async function resolveMapPin(source: MapPinSource): Promise<MapPin> {
  const lat = coord(source.lat);
  const lng = coord(source.lng);
  if (lat != null && lng != null && inShizuoka(lat, lng)) {
    return { id: source.id, lat, lng, ...pinExtras(source) };
  }
  if (source.address?.trim()) {
    const point = await geocodeAddress(source.address, source.region);
    if (point) return { id: source.id, ...point, ...pinExtras(source) };
  }
  return pinFromRegion(source.id, source.region, pinExtras(source));
}

export async function resolveMapPins(sources: MapPinSource[]) {
  const results = new Array<MapPin>(sources.length);
  let index = 0;

  async function worker() {
    while (index < sources.length) {
      const current = index;
      index += 1;
      results[current] = await resolveMapPin(sources[current]);
    }
  }

  const workers = Math.min(4, sources.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}
