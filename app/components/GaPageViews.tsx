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

function sendPageView(gaId: string, pagePath: string) {
  if (typeof window.gtag !== "function") return;
  // 各ページで metadata が共通のため、タイトルだけだと1件にまとまる。
  // 計測上はパスを含めて区別する（document.title 自体は変えない）
  const pageTitle =
    pagePath === "/"
      ? document.title
      : `${document.title} · ${pagePath}`;
  window.gtag("config", gaId, {
    send_page_view: false,
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  });
  window.gtag("event", "page_view", {
    send_to: gaId,
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  });
}

export default function GaPageViews({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    // onLoad を逃しても、gtag が入れば計測を開始する
    if (typeof window.gtag === "function") {
      setReady(true);
      return;
    }
    const timer = window.setInterval(() => {
      if (typeof window.gtag === "function") {
        setReady(true);
        window.clearInterval(timer);
      }
    }, 200);
    const stop = window.setTimeout(() => window.clearInterval(timer), 10000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const pagePath = search ? `${pathname}?${search}` : pathname;
    const timer = window.setTimeout(() => {
      sendPageView(gaId, pagePath);
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
