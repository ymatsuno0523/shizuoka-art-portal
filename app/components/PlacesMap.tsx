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

    async function setup() {
      const leaflet = await import("leaflet");
      const L = leaflet.default;
      if (cancelled || !node) return;

      map = L.map(node, { scrollWheelZoom: false }).setView(
        [SHIZUOKA_CENTER.lat, SHIZUOKA_CENTER.lng],
        9,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "map-pin",
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36" aria-hidden="true"><path fill="#18181b" d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24C24 5.4 18.6 0 12 0z"/><circle cx="12" cy="12" r="4.2" fill="#fff"/></svg>`,
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
      requestAnimationFrame(() => map?.invalidateSize());
      setTimeout(() => map?.invalidateSize(), 200);
    }

    void setup();
    return () => {
      cancelled = true;
      map?.remove();
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
        ピンをタップすると上が切り替わります。位置は市の目安です。
      </p>
    </div>
  );
}
