"use client";

import { useRouter } from "next/navigation";
import { goBackInAppOrReplace } from "@/app/components/HistoryBack";

export default function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => goBackInAppOrReplace(router, href)}
      className="rounded-xl border border-zinc-300 px-8 py-2.5 text-sm font-semibold min-w-40 dark:border-zinc-700"
    >
      {children}
    </button>
  );
}
