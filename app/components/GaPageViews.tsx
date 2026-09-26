"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GaPageViews({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || typeof window.gtag !== "function") return;

    const pagePath = search ? `${pathname}?${search}` : pathname;
    // SPA では config の page_path 更新がページ単位の計測になる
    // title は遷移直後に古いことがあるので、少し遅らせる
    const timer = window.setTimeout(() => {
      window.gtag?.("config", gaId, {
        page_path: pagePath,
        page_title: document.title,
        page_location: window.location.href,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [ready, pathname, search, gaId]);

  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${gaId}', { send_page_view: false });
      `}</Script>
      <Script
        id="ga-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
    </>
  );
}
