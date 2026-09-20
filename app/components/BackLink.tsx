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
      className="text-sm text-zinc-500"
    >
      {children}
    </button>
  );
}
