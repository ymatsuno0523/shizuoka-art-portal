import Link from "next/link";
import type { ReactNode } from "react";

export default function ThumbCard({
  href,
  imageUrl,
  children,
  footer,
}: {
  href: string;
  imageUrl?: string | null;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <li className="press-card flex items-end gap-2 rounded-[8px] border border-zinc-200 p-2 dark:border-zinc-800">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-[70px] w-[70px] shrink-0 rounded-[6px] object-cover"
          />
        ) : (
          <div className="h-[70px] w-[70px] shrink-0 rounded-[6px] bg-zinc-100 dark:bg-zinc-800" />
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </Link>
      {footer ? (
        <div className="mb-0.5 flex shrink-0 items-center justify-end gap-1.5">
          {footer}
        </div>
      ) : null}
    </li>
  );
}

export function firstImageUrl(
  images: { url: string; sort_order?: number | null }[] | null | undefined,
) {
  const sorted = [...(images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return sorted[0]?.url ?? null;
}
