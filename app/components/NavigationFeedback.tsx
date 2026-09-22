"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isMainTabRoot } from "@/lib/tab-nav";

const SHOW_AFTER_MS = 280;
const HIDE_AFTER_MS = 12000;

function isPlainLeftClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function destinationUrl(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || anchor.hasAttribute("download")) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  try {
    return new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
}

export default function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [pending, setPending] = useState(false);
  const waiting = useRef(false);
  const timers = useRef({ show: 0, hide: 0 });

  const clearTimers = () => {
    window.clearTimeout(timers.current.show);
    window.clearTimeout(timers.current.hide);
    timers.current.show = 0;
    timers.current.hide = 0;
  };

  useEffect(() => {
    waiting.current = false;
    clearTimers();
    setPending(false);
  }, [pathname, search]);

  useEffect(() => {
    const arm = () => {
      clearTimers();
      waiting.current = true;
      timers.current.show = window.setTimeout(() => {
        if (waiting.current) setPending(true);
      }, SHOW_AFTER_MS);
      timers.current.hide = window.setTimeout(() => {
        waiting.current = false;
        setPending(false);
      }, HIDE_AFTER_MS);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const pressed =
        target.closest(".press-card") ??
        target.closest("nav a")?.querySelector(".nav-press");
      if (!(pressed instanceof HTMLElement)) return;
      pressed.classList.remove("is-pressed");
      void pressed.offsetWidth;
      pressed.classList.add("is-pressed");
      window.setTimeout(() => pressed.classList.remove("is-pressed"), 460);
    };

    const onClick = (event: MouseEvent) => {
      if (!isPlainLeftClick(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = destinationUrl(anchor);
      if (!url || url.origin !== window.location.origin) return;
      const samePath = url.pathname === window.location.pathname;
      const sameSearch = url.search === window.location.search;
      if (samePath && sameSearch) return;
      if (samePath && isMainTabRoot(window.location.pathname) && !url.search) return;
      arm();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  if (!pending) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-40 flex h-[calc(100dvh-8rem)] w-full max-w-md -translate-x-1/2 items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-700 dark:border-t-zinc-100"
        role="status"
        aria-label="読み込み中"
      />
    </div>
  );
}
