"use client";

import { useRouter } from "next/navigation";

export default function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleClick() {
    try {
      const referrer = document.referrer;
      if (referrer && new URL(referrer).origin === window.location.origin) {
        router.back();
        return;
      }
    } catch {
      // ignore invalid referrer
    }
    router.replace(href);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-xl border border-zinc-300 px-8 py-2.5 text-sm font-semibold min-w-40 dark:border-zinc-700"
    >
      {children}
    </button>
  );
}
