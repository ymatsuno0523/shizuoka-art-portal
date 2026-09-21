const KEY = "sap.authNext";

export function isSafeAppPath(path: string | null | undefined): path is string {
  return Boolean(
    path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"),
  );
}

export function rememberAuthNext(next: string | null) {
  if (typeof window === "undefined") return;
  if (isSafeAppPath(next)) sessionStorage.setItem(KEY, next);
  else sessionStorage.removeItem(KEY);
}

export function consumeAuthNext() {
  if (typeof window === "undefined") return "/mypage";
  const next = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  return isSafeAppPath(next) ? next : "/mypage";
}
