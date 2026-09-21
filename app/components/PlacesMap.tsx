"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import type { MapPin } from "@/lib/geo";
import { SHIZUOKA_CENTER } from "@/lib/geo";

export default function PlacesMap({ pins }: { pins: MapPin[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(pins[0]?.id ?? null);
  const selected = pins.find((pin) => pin.id === selectedId) ?? null;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    let frame = 0;
    let timer = 0;

    async function setup() {
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
      for (const pin of pins) {
        const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon });
        marker.on("click", () => setSelectedId(pin.id));
        marker.addTo(group);
      }
      group.addTo(map);
      if (pins.length > 0) {
        map.fitBounds(group.getBounds().pad(0.35), { maxZoom: 12 });
      }
      const current = map;
      frame = requestAnimationFrame(() => {
        if (!cancelled) current.invalidateSize();
      });
      timer = window.setTimeout(() => {
        if (!cancelled) current.invalidateSize();
      }, 200);
    }

    void setup();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      map?.remove();
      map = undefined;
    };
  }, [pins]);

  if (pins.length === 0) {
    return <p className="text-sm text-zinc-500">まだ地図に出すものがありません。</p>;
  }

  return (
    <div>
      {selected ? (
        <Link
          href={selected.href}
          className="mb-3 block rounded-[8px] border border-zinc-200 px-3 py-2 dark:border-zinc-800"
        >
          <p className="font-semibold">{selected.title}</p>
          <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
            {selected.subtitle}
          </p>
        </Link>
      ) : null}
      <div className="relative z-0 isolate h-[min(22rem,calc(100dvh-18rem))] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div ref={containerRef} className="h-full min-h-[16rem] w-full" />
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        ピンをタップすると上が切り替わります。位置は地域の目安です。
      </p>
    </div>
  );
}
