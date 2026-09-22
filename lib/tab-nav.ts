export type MainTab = "events" | "venues" | "circles" | "mypage";

export const TAB_HREFS: Record<MainTab, string> = {
  events: "/events",
  venues: "/venues",
  circles: "/circles",
  mypage: "/mypage",
};

const STACK_KEY = "sap.stack";
const NAV_KEY = "sap.nav";
const EVENTS_ROOT_KEY = "sap.eventsRoot";
const PENDING_TAB_KEY = "sap.pendingTab";
const EVENTS_UNDER = "sapEventsUnder";

export function mainTabFromPath(pathname: string): MainTab | null {
  if (pathname === "/events" || pathname.startsWith("/events/")) return "events";
  if (pathname === "/venues" || pathname.startsWith("/venues/")) return "venues";
  if (pathname === "/circles" || pathname.startsWith("/circles/")) return "circles";
  if (pathname === "/mypage" || pathname.startsWith("/mypage/")) return "mypage";
  return null;
}

export function isMainTabRoot(pathname: string): boolean {
  return (
    pathname === "/events" ||
    pathname === "/venues" ||
    pathname === "/circles" ||
    pathname === "/mypage"
  );
}

export function isSecondaryTabRoot(pathname: string): boolean {
  return pathname === "/venues" || pathname === "/circles" || pathname === "/mypage";
}

export function pageUrl(pathname: string, search = ""): string {
  return search ? `${pathname}?${search}` : pathname;
}

function pathOnly(url: string) {
  return url.split("?")[0] ?? url;
}

function historyState(): Record<string, unknown> {
  const state = window.history.state;
  if (state && typeof state === "object") return { ...(state as Record<string, unknown>) };
  return {};
}

export function readStack(): string[] {
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  sessionStorage.setItem(STACK_KEY, JSON.stringify(stack));
}

export function setNavMode(mode: "push" | "replace" | "back") {
  sessionStorage.setItem(NAV_KEY, mode);
}

export function replaceAppHref(
  router: { replace: (href: string) => void },
  href: string,
) {
  setNavMode("replace");
  router.replace(href);
}

function consumeNavMode() {
  const mode = sessionStorage.getItem(NAV_KEY);
  sessionStorage.removeItem(NAV_KEY);
  return mode === "replace" || mode === "back" || mode === "push" ? mode : null;
}

export function markEventsRoot() {
  sessionStorage.setItem(EVENTS_ROOT_KEY, "1");
}

function hasEventsRoot(): boolean {
  return sessionStorage.getItem(EVENTS_ROOT_KEY) === "1";
}

export function setPendingTab(href: string) {
  sessionStorage.setItem(PENDING_TAB_KEY, href);
}

export function consumePendingTab() {
  const href = sessionStorage.getItem(PENDING_TAB_KEY);
  sessionStorage.removeItem(PENDING_TAB_KEY);
  return href;
}

export function canGoBackInApp() {
  return readStack().length > 1;
}

export function stackDeltaTo(predicate: (url: string) => boolean): number | null {
  const stack = readStack();
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const url = stack[i];
    if (url && predicate(url)) return stack.length - 1 - i;
  }
  return null;
}

export function isEventsRootUrl(url: string) {
  return pathOnly(url) === "/events";
}

export function isTabRootUrl(url: string, tab: MainTab) {
  return pathOnly(url) === TAB_HREFS[tab];
}

export function markEventsUnder() {
  const state = historyState();
  if (state[EVENTS_UNDER]) return;
  window.history.replaceState({ ...state, [EVENTS_UNDER]: true }, "");
}

export function injectEventsUnderlay(currentUrl: string) {
  const state = historyState();
  window.history.replaceState({ ...state, [EVENTS_UNDER]: true }, "", "/events");
  window.history.pushState({ ...state, [EVENTS_UNDER]: true }, "", currentUrl);
  markEventsRoot();
  writeStack(["/events", currentUrl]);
}

export function syncTabHistory(pathname: string, search: string) {
  const url = pageUrl(pathname, search);

  if (pathname === "/events") markEventsRoot();

  if (isSecondaryTabRoot(pathname)) {
    if (!hasEventsRoot()) {
      injectEventsUnderlay(url);
      return;
    }
    markEventsUnder();
  }

  const stack = readStack();
  const last = stack[stack.length - 1];
  const mode = consumeNavMode();
  if (last === url) return;

  const existing = stack.lastIndexOf(url);
  if (existing >= 0 && existing < stack.length - 1) {
    writeStack(stack.slice(0, existing + 1));
    return;
  }

  if (mode === "back") {
    if (existing >= 0) writeStack(stack.slice(0, existing + 1));
    else if (stack.length > 1) writeStack(stack.slice(0, -1).concat(url));
    else writeStack([url]);
    return;
  }

  if (mode === "replace" || (last && pathOnly(last) === pathname)) {
    if (stack.length === 0) writeStack([url]);
    else writeStack(stack.slice(0, -1).concat(url));
    return;
  }

  writeStack(stack.concat(url));
}
