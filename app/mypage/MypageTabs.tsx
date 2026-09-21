"use client";

import Link from "next/link";

export const MYPAGE_TABS = [
  { id: "events", label: "イベント" },
  { id: "venues", label: "施設" },
  { id: "circles", label: "団体" },
] as const;

export type MypageTab = (typeof MYPAGE_TABS)[number]["id"];

export function parseMypageTab(value: string | null): MypageTab {
  if (value === "venues" || value === "circles") return value;
  return "events";
}

export default function MypageTabs({
  path,
  current,
}: {
  path: string;
  current: MypageTab;
}) {
  return (
    <nav className="mb-4 flex rounded-full border border-zinc-200 p-0.5 text-xs dark:border-zinc-700">
      {MYPAGE_TABS.map((tab) => {
        const href = tab.id === "events" ? path : `${path}?tab=${tab.id}`;
        const active = current === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            replace
            className={`flex-1 rounded-full py-1.5 text-center ${
              active
                ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
