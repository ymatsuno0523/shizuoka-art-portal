"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AREA_CITIES } from "@/lib/event-form";
import {
  AREA_ORDER,
  buildListHref,
  joinFilters,
  summarizeRegions,
  toggleArea,
  toggleValue,
} from "@/lib/search-filters";

type FilterGroup = {
  key: string;
  label: string;
  values: string[];
  options: readonly string[];
  areas?: boolean;
};

type FilterToggle = {
  key: string;
  label: string;
  checked: boolean;
};

const checkboxClass = "h-4 w-4 shrink-0 accent-zinc-900";

export default function FilterSheet({
  path,
  view,
  groups,
  toggles = [],
}: {
  path: string;
  view?: string;
  groups: FilterGroup[];
  toggles?: FilterToggle[];
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [draftFlags, setDraftFlags] = useState<Record<string, boolean>>({});
  const draftRef = useRef(draft);
  const flagsRef = useRef(draftFlags);
  draftRef.current = draft;
  flagsRef.current = draftFlags;

  const summaries = groups
    .map((group) =>
      group.areas ? summarizeRegions(group.values) : group.values.join("、"),
    )
    .filter(Boolean);
  for (const toggle of toggles) {
    if (toggle.checked) {
      summaries.push(toggle.key === "past" ? "終了も含む" : toggle.label);
    }
  }
  const activeCount =
    groups.filter((group) => group.values.length > 0).length +
    toggles.filter((toggle) => toggle.checked).length;

  function openSheet() {
    setDraft(Object.fromEntries(groups.map((group) => [group.key, [...group.values]])));
    setDraftFlags(Object.fromEntries(toggles.map((toggle) => [toggle.key, toggle.checked])));
    setOpen(true);
  }

  function commit(
    nextDraft: Record<string, string[]>,
    nextFlags: Record<string, boolean>,
  ) {
    const params: Record<string, string | undefined> = {
      view: view && view !== "list" ? view : undefined,
    };
    for (const group of groups) {
      params[group.key] = joinFilters(nextDraft[group.key] ?? [], group.options);
    }
    for (const toggle of toggles) {
      params[toggle.key] = nextFlags[toggle.key] ? "1" : undefined;
    }
    router.replace(buildListHref(path, params), { scroll: false });
    setOpen(false);
  }

  const commitRef = useRef(commit);
  commitRef.current = commit;

  function close() {
    commitRef.current(draftRef.current, flagsRef.current);
  }

  function clearDraft() {
    setDraft(Object.fromEntries(groups.map((group) => [group.key, []])));
    setDraftFlags(Object.fromEntries(toggles.map((toggle) => [toggle.key, false])));
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        commitRef.current(draftRef.current, flagsRef.current);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
          activeCount
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-200 dark:border-zinc-700"
        }`}
      >
        絞り込む
        {activeCount > 0 ? ` · ${activeCount}` : ""}
      </button>
      {summaries.length > 0 ? (
        <p className="mt-1.5 truncate text-xs text-zinc-500">{summaries.join(" · ")}</p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="閉じる"
            className="absolute inset-0 bg-black/40"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] max-w-md flex-col rounded-t-2xl bg-background shadow-xl"
          >
            <div className="flex justify-center pt-2">
              <span className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <h2 id={titleId} className="text-sm font-bold">
                絞り込み
              </h2>
              <button type="button" onClick={close} className="text-sm text-zinc-500">
                閉じる
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              {groups.map((group) => {
                const selected = draft[group.key] ?? [];
                const gridClass = group.areas
                  ? "grid grid-cols-3 gap-x-2 gap-y-2.5"
                  : "grid grid-cols-[repeat(2,auto)] gap-x-3 gap-y-2.5 [&_label]:w-max [&_label]:whitespace-nowrap";
                return (
                  <section key={group.key} className="mb-4">
                    <p className="mb-2 text-xs font-semibold text-zinc-500">{group.label}</p>
                    {group.areas ? (
                      <div className="mb-2 flex gap-2">
                        {AREA_ORDER.map((area) => {
                          const cities = AREA_CITIES[area];
                          const on = cities.every((city) => selected.includes(city));
                          return (
                            <button
                              key={area}
                              type="button"
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  [group.key]: toggleArea(current[group.key] ?? [], cities),
                                }))
                              }
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                on
                                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}
                            >
                              {area}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    {group.areas ? (
                      AREA_ORDER.map((area) => (
                        <div key={area} className="mb-2">
                          <p className="mb-1 text-[11px] text-zinc-400">{area}</p>
                          <div className={gridClass}>
                            {AREA_CITIES[area].map((option) => (
                              <CheckItem
                                key={option}
                                label={option}
                                checked={selected.includes(option)}
                                onChange={() =>
                                  setDraft((current) => ({
                                    ...current,
                                    [group.key]: toggleValue(current[group.key] ?? [], option),
                                  }))
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={gridClass}>
                        {group.options.map((option) => (
                          <CheckItem
                            key={option}
                            label={option}
                            checked={selected.includes(option)}
                            onChange={() =>
                              setDraft((current) => ({
                                ...current,
                                [group.key]: toggleValue(current[group.key] ?? [], option),
                              }))
                            }
                          />
                        ))}
                      </div>
                    )}
                    {group.areas && group.options.includes("その他") ? (
                      <CheckItem
                        label="その他"
                        checked={selected.includes("その他")}
                        onChange={() =>
                          setDraft((current) => ({
                            ...current,
                            [group.key]: toggleValue(current[group.key] ?? [], "その他"),
                          }))
                        }
                      />
                    ) : null}
                  </section>
                );
              })}

              {toggles.length > 0 ? (
                <div className="space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  {toggles.map((toggle) => (
                    <CheckItem
                      key={toggle.key}
                      label={toggle.label}
                      checked={Boolean(draftFlags[toggle.key])}
                      onChange={() =>
                        setDraftFlags((current) => ({
                          ...current,
                          [toggle.key]: !current[toggle.key],
                        }))
                      }
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex gap-2 border-t border-zinc-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
              <button
                type="button"
                onClick={clearDraft}
                className="rounded-xl px-3 py-2.5 text-sm text-zinc-500"
              >
                クリア
              </button>
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                完了
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-sm leading-snug">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={checkboxClass}
      />
      <span>{label}</span>
    </label>
  );
}
