"use client";

import { useRouter } from "next/navigation";
import { canGoBackInApp, setNavMode } from "@/lib/tab-nav";

export function goBackInAppOrReplace(
  router: { back: () => void; replace: (href: string) => void },
  fallback: string,
) {
  setNavMode("back");
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
