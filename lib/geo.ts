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

const GSI_ADDRESS_SEARCH = "https://msearch.gsi.go.jp/address-search/AddressSearch";
const geocodeCache = new Map<string, GeoPoint>();

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

/** 番地・丁目など、地図に出してよい粒度の住所か */
export function isMappableAddress(address: string | null | undefined) {
  const text = address?.normalize("NFKC").trim() ?? "";
  if (!text) return false;
  const compact = text.replace(/\s+/g, "");
  return (
    /[0-9０-９]+(丁目|番地|番|号)/.test(compact) ||
    /[0-9０-９]+[-‐‑‒–—―ー－−][0-9０-９]/.test(compact)
  );
}

function pinExtras(source: MapPinSource): Omit<MapPin, "id" | "lat" | "lng"> {
  return { title: source.title, href: source.href, subtitle: source.subtitle };
}

export function pinFromSource(source: MapPinSource): MapPin | null {
  if (!isMappableAddress(source.address)) return null;
  const lat = coord(source.lat);
  const lng = coord(source.lng);
  if (lat != null && lng != null && inShizuoka(lat, lng)) {
    return { id: source.id, lat, lng, ...pinExtras(source) };
  }
  return null;
}

async function resolveMapPin(source: MapPinSource): Promise<MapPin | null> {
  if (!isMappableAddress(source.address)) return null;
  const lat = coord(source.lat);
  const lng = coord(source.lng);
  if (lat != null && lng != null && inShizuoka(lat, lng)) {
    return { id: source.id, lat, lng, ...pinExtras(source) };
  }
  const point = await geocodeAddress(source.address, source.region);
  if (point) return { id: source.id, ...point, ...pinExtras(source) };
  return null;
}

export async function resolveMapPins(sources: MapPinSource[]) {
  const results = new Array<MapPin | null>(sources.length);
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
  return results.filter((pin): pin is MapPin => pin != null);
}
