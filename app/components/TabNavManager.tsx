"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { consumePendingTab, setNavMode, syncTabHistory } from "@/lib/tab-nav";

export default function TabNavManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();

  useLayoutEffect(() => {
    syncTabHistory(pathname, search);
  }, [pathname, search]);

  useEffect(() => {
    if (pathname !== "/events") return;
    const pending = consumePendingTab();
    if (!pending) return;
    setNavMode("push");
    router.push(pending);
  }, [pathname, router]);

  return null;
}
