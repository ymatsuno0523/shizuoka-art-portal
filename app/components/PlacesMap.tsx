"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import {
  isMappableAddress,
  pinFromSource,
  resolveMapPins,
  SHIZUOKA_CENTER,
  type MapPin,
  type MapPinSource,
} from "@/lib/geo";

function pinIconHtml(selected: boolean) {
  const fill = selected ? "#db7e45" : "#3f3f46";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="26" viewBox="0 0 24 26" aria-hidden="true"><path fill="${fill}" d="M12 1.2C6.4 1.2 2 5.6 2 11c0 4.8 6.2 10.4 8.6 12.6a2.4 2.4 0 0 0 2.8 0C15.8 21.4 22 15.8 22 11c0-5.4-4.4-9.8-10-9.8z"/><circle cx="12" cy="10.8" r="3.8" fill="#fff"/></svg>`;
}

export default function PlacesMap({ pins }: { pins: MapPinSource[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const selectedIdRef = useRef<string | null>(null);
  const signature = pins
    .map((pin) =>
      [pin.id, pin.lat ?? "", pin.lng ?? "", pin.address ?? "", pin.region ?? ""].join("\u0001"),
    )
    .join("\u0002");
  const needsLookup = pins.some(
    (pin) =>
      isMappableAddress(pin.address) &&
      (pin.lat == null || pin.lng == null),
  );
  const [resolved, setResolved] = useState<MapPin[] | null>(() => {
    if (needsLookup) return null;
    return pins.map(pinFromSource).filter((pin): pin is MapPin => pin != null);
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    setSelectedId(null);
  }, [signature]);

  useEffect(() => {
    let cancelled = false;
    const current = pinsRef.current;
    const needsLookup = current.some(
      (pin) =>
        isMappableAddress(pin.address) &&
        (pin.lat == null || pin.lng == null),
    );
    if (!needsLookup) {
      const next = current
        .map(pinFromSource)
        .filter((pin): pin is MapPin => pin != null);
      setResolved((prev) => {
        if (
          prev &&
          prev.length === next.length &&
          prev.every(
            (pin, index) =>
              pin.id === next[index].id &&
              pin.lat === next[index].lat &&
              pin.lng === next[index].lng,
          )
        ) {
          return prev;
        }
        return next;
      });
      return;
    }
    setResolved(null);
    void resolveMapPins(current).then((next) => {
      if (!cancelled) setResolved(next);
    });
    return () => {
      cancelled = true;
    };
  }, [signature]);

  const selected = pins.find((pin) => pin.id === selectedId) ?? null;

  useEffect(() => {
    const ready = resolved;
    if (!ready) return;
    const node = containerRef.current;
    if (!node) return;

    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    let frame = 0;
    let timer = 0;

    async function setup(pinsToDraw: MapPin[]) {
      const leaflet = await import("leaflet");
      const L = leaflet.default;
      const el = containerRef.current;
      if (cancelled || !el?.isConnected) return;

      map = L.map(el, { scrollWheelZoom: false }).setView(
        [SHIZUOKA_CENTER.lat, SHIZUOKA_CENTER.lng],
        9,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const makeIcon = (selected: boolean) =>
        L.divIcon({
          className: "map-pin",
          iconSize: [24, 26],
          iconAnchor: [12, 25],
          html: pinIconHtml(selected),
        });

      markersRef.current = new Map();
      const group = L.featureGroup();
      for (const pin of pinsToDraw) {
        const marker = L.marker([pin.lat, pin.lng], {
          icon: makeIcon(selectedIdRef.current === pin.id),
        });
        marker.on("click", () => setSelectedId(pin.id));
        marker.addTo(group);
        markersRef.current.set(pin.id, marker);
      }
      group.addTo(map);
      const current = map;
      const fit = () => {
        if (pinsToDraw.length === 0) return;
        current.fitBounds(group.getBounds().pad(0.35), { maxZoom: 15 });
      };
      fit();
      frame = requestAnimationFrame(() => {
        if (cancelled) return;
        current.invalidateSize();
        fit();
      });
      timer = window.setTimeout(() => {
        if (cancelled) return;
        current.invalidateSize();
        fit();
      }, 200);
    }

    void setup(ready);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      markersRef.current = new Map();
      map?.remove();
      map = undefined;
    };
  }, [resolved]);

  useEffect(() => {
    const markers = markersRef.current;
    if (markers.size === 0) return;
    void import("leaflet").then((leaflet) => {
      const L = leaflet.default;
      for (const [id, marker] of markers) {
        marker.setIcon(
          L.divIcon({
            className: "map-pin",
            iconSize: [24, 26],
            iconAnchor: [12, 25],
            html: pinIconHtml(id === selectedId),
          }),
        );
      }
    });
  }, [selectedId, resolved]);

  if (pins.length === 0) {
    return <p className="text-sm text-zinc-500">まだ地図に出すものがありません。</p>;
  }

  return (
    <div>
      {selected ? (
        <Link
          href={selected.href}
          className="press-card mb-3 block rounded-[8px] border border-zinc-200 px-3 py-2 dark:border-zinc-800"
        >
          <p className="font-semibold">{selected.title}</p>
          <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
            {selected.subtitle}
          </p>
        </Link>
      ) : (
        <p className="mb-3 text-sm text-zinc-500">ピンを選ぶと内容が表示されます。</p>
      )}
      <div className="relative z-0 isolate h-[min(22rem,calc(100dvh-18rem))] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        {resolved == null ? (
          <p className="flex h-full min-h-[16rem] items-center justify-center text-sm text-zinc-500">
            住所の位置を探しています…
          </p>
        ) : resolved.length === 0 ? (
          <p className="flex h-full min-h-[16rem] items-center justify-center px-4 text-center text-sm text-zinc-500">
            番地まで入った住所があるものだけ地図に表示します。
          </p>
        ) : (
          <div ref={containerRef} className="h-full min-h-[16rem] w-full" />
        )}
      </div>
    </div>
  );
}
