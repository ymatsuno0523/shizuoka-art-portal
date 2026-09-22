"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import {
  pinFromSource,
  resolveMapPins,
  SHIZUOKA_CENTER,
  type MapPin,
  type MapPinSource,
} from "@/lib/geo";

export default function PlacesMap({ pins }: { pins: MapPinSource[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const signature = pins
    .map((pin) =>
      [pin.id, pin.lat ?? "", pin.lng ?? "", pin.address ?? "", pin.region ?? ""].join("\u0001"),
    )
    .join("\u0002");
  const needsLookup = pins.some(
    (pin) => (pin.lat == null || pin.lng == null) && Boolean(pin.address?.trim()),
  );
  const [resolved, setResolved] = useState<MapPin[] | null>(() =>
    needsLookup ? null : pins.map(pinFromSource),
  );
  const [selectedId, setSelectedId] = useState<string | null>(pins[0]?.id ?? null);

  useEffect(() => {
    let cancelled = false;
    const current = pinsRef.current;
    const needsLookup = current.some(
      (pin) => (pin.lat == null || pin.lng == null) && pin.address?.trim(),
    );
    if (!needsLookup) {
      const next = current.map(pinFromSource);
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

  const selected = pins.find((pin) => pin.id === selectedId) ?? pins[0] ?? null;

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

      const pinIcon = L.divIcon({
        className: "map-pin",
        iconSize: [24, 26],
        iconAnchor: [12, 25],
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="26" viewBox="0 0 24 26" aria-hidden="true"><path fill="#3f3f46" d="M12 1.2C6.4 1.2 2 5.6 2 11c0 4.8 6.2 10.4 8.6 12.6a2.4 2.4 0 0 0 2.8 0C15.8 21.4 22 15.8 22 11c0-5.4-4.4-9.8-10-9.8z"/><circle cx="12" cy="10.8" r="3.8" fill="#fff"/></svg>`,
      });
      const group = L.featureGroup();
      for (const pin of pinsToDraw) {
        const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon });
        marker.on("click", () => setSelectedId(pin.id));
        marker.addTo(group);
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
      map?.remove();
      map = undefined;
    };
  }, [resolved]);

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
      ) : null}
      <div className="relative z-0 isolate h-[min(22rem,calc(100dvh-18rem))] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        {resolved ? (
          <div ref={containerRef} className="h-full min-h-[16rem] w-full" />
        ) : (
          <p className="flex h-full min-h-[16rem] items-center justify-center text-sm text-zinc-500">
            住所の位置を探しています…
          </p>
        )}
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        ピンをタップすると上が切り替わります。住所があるものはその場所、ないものは地域の目安です。
      </p>
    </div>
  );
}
