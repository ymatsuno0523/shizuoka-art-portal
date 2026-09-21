"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatEventDate } from "@/lib/events";

type CalendarEvent = {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  placeLabel: string;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function tokyoParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function ymdKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function eventDayKeys(startAt: string, endAt: string | null) {
  const start = tokyoParts(new Date(startAt));
  const end = tokyoParts(new Date(endAt || startAt));
  const first = ymdKey(start.year, start.month, start.day);
  const last = ymdKey(end.year, end.month, end.day);
  if (last < first) return [first];

  const keys: string[] = [];
  let year = start.year;
  let month = start.month;
  let day = start.day;
  while (keys.length < 366) {
    const key = ymdKey(year, month, day);
    keys.push(key);
    if (key >= last) break;
    const next = new Date(year, month - 1, day + 1);
    year = next.getFullYear();
    month = next.getMonth() + 1;
    day = next.getDate();
  }
  return keys;
}

function monthCells(year: number, month: number) {
  const startWeekday = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`,
  ).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function EventCalendar({ events }: { events: CalendarEvent[] }) {
  const today = tokyoParts(new Date());
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [selectedKey, setSelectedKey] = useState(ymdKey(today.year, today.month, today.day));

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      for (const key of eventDayKeys(event.start_at, event.end_at)) {
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
      }
    }
    return map;
  }, [events]);

  const cells = monthCells(cursor.year, cursor.month);
  const selectedEvents = eventsByDay.get(selectedKey) ?? [];
  const selectedInMonth = selectedKey.startsWith(
    `${cursor.year}-${String(cursor.month).padStart(2, "0")}`,
  );

  function shiftMonth(delta: number) {
    const date = new Date(cursor.year, cursor.month - 1 + delta, 1);
    setCursor({ year: date.getFullYear(), month: date.getMonth() + 1 });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-lg px-2 py-1 text-sm text-zinc-500"
        >
          ‹
        </button>
        <p className="text-sm font-semibold">
          {cursor.year}年{cursor.month}月
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-lg px-2 py-1 text-sm text-zinc-500"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] text-zinc-500">
        {WEEKDAYS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;
          const key = ymdKey(cursor.year, cursor.month, day);
          const hasEvents = (eventsByDay.get(key)?.length ?? 0) > 0;
          const isSelected = selectedKey === key;
          const isToday =
            cursor.year === today.year &&
            cursor.month === today.month &&
            day === today.day;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                isToday
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : ""
              }`}
            >
              {day}
              {hasEvents ? (
                <span
                  className={`pointer-events-none absolute bottom-0 left-1/2 h-[6px] w-[6px] -translate-x-1/2 rounded-full ${
                    isToday
                      ? "bg-white dark:bg-zinc-900"
                      : "bg-zinc-900 dark:bg-zinc-100"
                  }`}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {!selectedInMonth ? (
          <p className="text-sm text-zinc-500">日付を選ぶと、その日のイベントが出ます。</p>
        ) : selectedEvents.length === 0 ? (
          <p className="text-sm text-zinc-500">この日のイベントはありません。</p>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block rounded-[8px] border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <p className="text-xs text-zinc-500">
                    {formatEventDate(event.start_at)}
                    {event.end_at ? ` 〜 ${formatEventDate(event.end_at)}` : null}
                  </p>
                  <p className="mt-0.5 font-semibold">{event.title}</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
                    {event.placeLabel}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
