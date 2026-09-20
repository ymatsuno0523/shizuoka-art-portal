"use client";

import { useRef, useState } from "react";

type ImageSliderProps = {
  urls: string[];
  alt: string;
};

const slideBox =
  "flex h-[min(20rem,50dvh)] w-full min-h-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900";

const slideImage = "h-auto w-auto max-h-full max-w-full object-contain";

export default function ImageSlider({ urls, alt }: ImageSliderProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (urls.length === 0) return null;

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActive(index);
  }

  if (urls.length === 1) {
    return (
      <div className={slideBox}>
        <img src={urls[0]} alt={alt} className={slideImage} />
      </div>
    );
  }

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {urls.map((url, index) => (
          <div
            key={url}
            className={`${slideBox} min-w-full shrink-0 basis-full snap-center`}
          >
            <img src={url} alt={`${alt} ${index + 1}`} className={slideImage} />
          </div>
        ))}
      </div>
      <ul className="mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {urls.map((url, index) => (
          <li key={url} className="shrink-0">
            <button
              type="button"
              onClick={() => goTo(index)}
              aria-label={`${alt} ${index + 1}`}
              aria-current={active === index ? "true" : undefined}
              className={`block overflow-hidden rounded-lg ${
                active === index ? "opacity-100" : "opacity-40"
              }`}
            >
              <img src={url} alt="" className="h-14 w-14 object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
