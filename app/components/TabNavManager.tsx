"use client";

import { useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { syncTabHistory } from "@/lib/tab-nav";

export default function TabNavManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useLayoutEffect(() => {
    syncTabHistory(pathname, search);
  }, [pathname, search]);

  return null;
}
