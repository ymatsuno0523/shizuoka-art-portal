"use client";

type ImageSliderProps = {
  urls: string[];
  alt: string;
};

export default function ImageSlider({ urls, alt }: ImageSliderProps) {
  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <img
        src={urls[0]}
        alt={alt}
        className="mx-auto h-auto w-full rounded-xl object-contain"
      />
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto snap-x snap-mandatory">
      <div className="flex">
        {urls.map((url, index) => (
          <img
            key={url}
            src={url}
            alt={`${alt} ${index + 1}`}
            className="h-auto w-full min-w-full snap-center object-contain px-4"
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500">
        横にスワイプ（{urls.length}枚）
      </p>
    </div>
  );
}
