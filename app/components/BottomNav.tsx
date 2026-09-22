"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  isEventsRootUrl,
  isMainTabRoot,
  isTabRootUrl,
  mainTabFromPath,
  setNavMode,
  setPendingTab,
  stackDeltaTo,
  type MainTab,
} from "@/lib/tab-nav";

const items = [
  { href: "/events", tab: "events" as const, label: "イベント", icon: CalendarIcon },
  { href: "/venues", tab: "venues" as const, label: "施設", icon: VenueIcon },
  { href: "/circles", tab: "circles" as const, label: "団体", icon: CircleIcon },
  { href: "/mypage", tab: "mypage" as const, label: "マイページ", icon: UserIcon },
] as const;

function goDelta(delta: number) {
  setNavMode("back");
  window.history.go(-delta);
}

function openTab(
  router: { push: (href: string) => void; replace: (href: string) => void },
  pathname: string,
  target: MainTab,
  href: string,
) {
  const from = mainTabFromPath(pathname);
  const fromRoot = isMainTabRoot(pathname);

  if (from === target && fromRoot) return;

  if (from === target) {
    const delta = stackDeltaTo((url) => isTabRootUrl(url, target));
    if (delta && delta > 0) goDelta(delta);
    else {
      setNavMode("replace");
      router.replace(href);
    }
    return;
  }

  if (target === "events") {
    const delta = stackDeltaTo(isEventsRootUrl);
    if (delta && delta > 0) goDelta(delta);
    else {
      setNavMode("replace");
      router.replace("/events");
    }
    return;
  }

  if (from === "events" && fromRoot) {
    setNavMode("push");
    router.push(href);
    return;
  }

  if (fromRoot) {
    setNavMode("replace");
    router.replace(href);
    return;
  }

  const delta = stackDeltaTo(isEventsRootUrl);
  if (delta && delta > 0) {
    setPendingTab(href);
    goDelta(delta);
    return;
  }

  setNavMode("replace");
  router.replace(href);
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-zinc-200 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                  active
                    ? "font-semibold text-foreground"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return;
                  }
                  event.preventDefault();
                  openTab(router, pathname, item.tab, item.href);
                }}
              >
                <span className="nav-press">
                  <Icon active={active} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}

function VenueIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      aria-hidden
    >
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function CircleIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      aria-hidden
    >
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M4 19c.8-3 2.8-5 5-5s4.2 2 5 5" />
      <path d="M14 19c.4-2 1.6-3.5 3.2-3.5 1.4 0 2.5 1 3 2.5" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.5 3.7-5.5 7-5.5s5.8 2 7 5.5" />
    </svg>
  );
}
