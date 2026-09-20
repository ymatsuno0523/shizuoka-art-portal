import Link from "next/link";
import { buildListHref } from "@/lib/search-filters";

export default function ViewSwitcher({
  basePath,
  views,
  current,
  params,
}: {
  basePath: string;
  views: { id: string; label: string }[];
  current: string;
  params?: Record<string, string | undefined>;
}) {
  return (
    <nav className="mb-3 flex rounded-full border border-zinc-200 p-0.5 text-xs dark:border-zinc-700">
      {views.map((view) => {
        const href = buildListHref(basePath, {
          ...params,
          view: view.id === "list" ? undefined : view.id,
        });
        const active = current === view.id;
        return (
          <Link
            key={view.id}
            href={href}
            replace
            className={`flex-1 rounded-full py-1.5 text-center ${
              active
                ? "bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500"
            }`}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
