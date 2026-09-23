"use client";

import Link from "next/link";
import { CategoryChips } from "@/app/components/CategoryChip";
import MineGate from "@/app/components/MineGate";
import NoImage from "@/app/components/NoImage";
import type { CircleWithImages } from "@/lib/circles";

export default function CircleBrowse({
  circles,
  emptyAll,
  saved,
}: {
  circles: CircleWithImages[];
  emptyAll: boolean;
  saved?: boolean;
}) {
  return (
    <MineGate items={circles} kind="circle" saved={saved}>
      {(items) => {
        if (emptyAll) {
          return <p className="text-sm text-zinc-500">まだ団体がありません。</p>;
        }
        if (items.length === 0) {
          return <p className="text-sm text-zinc-500">条件に合う団体がありません。</p>;
        }
        return (
          <ul className="space-y-3">
            {items.map((circle) => (
              <li key={circle.id}>
                <Link
                  href={`/circles/${circle.id}`}
                  className="press-card flex items-center gap-3 rounded-[8px] border border-zinc-200 p-2 dark:border-zinc-800"
                >
                  {circle.images[0] ? (
                    <img
                      src={circle.images[0].url}
                      alt=""
                      className="h-[70px] w-[70px] shrink-0 rounded-[6px] object-cover"
                    />
                  ) : (
                    <NoImage className="h-[70px] w-[70px] shrink-0 rounded-[6px]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{circle.name}</p>
                    <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                      {circle.region ? (
                        <p className="min-w-0 truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {circle.region}
                        </p>
                      ) : null}
                      <CategoryChips labels={circle.kind} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        );
      }}
    </MineGate>
  );
}
