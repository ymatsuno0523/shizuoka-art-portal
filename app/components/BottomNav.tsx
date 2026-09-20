"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/events", label: "イベント", icon: CalendarIcon },
  { href: "/venues", label: "会場", icon: VenueIcon },
  { href: "/circles", label: "サークル", icon: CircleIcon },
  { href: "/mypage", label: "マイページ", icon: UserIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

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
                replace
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                  active
                    ? "font-semibold text-foreground"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Icon active={active} />
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
