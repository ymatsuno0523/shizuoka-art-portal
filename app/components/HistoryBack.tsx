"use client";

import { useRouter } from "next/navigation";
import { canGoBackInApp, readStack, setNavMode } from "@/lib/tab-nav";

function pathOnly(url: string) {
  return url.split("?")[0] ?? url;
}

export function goBackInAppOrReplace(
  router: { back: () => void; replace: (href: string) => void },
  fallback: string,
) {
  setNavMode("back");
  const stack = readStack();
  const previous = stack.length >= 2 ? stack[stack.length - 2] : "";
  const previousPath = previous ? pathOnly(previous) : "";
  const currentPath = window.location.pathname;
  const previousIsForm = previousPath.endsWith("/new") || previousPath.endsWith("/edit");
  if (previousIsForm || (previousPath && previousPath === currentPath)) {
    router.replace(fallback);
    return;
  }
  if (canGoBackInApp()) {
    router.back();
    return;
  }
  router.replace(fallback);
}

export default function HistoryBack({
  href,
  className = "text-sm text-zinc-500",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() => goBackInAppOrReplace(router, href)}
    >
      {children}
    </button>
  );
}
