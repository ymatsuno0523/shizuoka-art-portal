import Link from "next/link";

export default function ViewSwitcher({
  basePath,
  views,
  current,
}: {
  basePath: string;
  views: { id: string; label: string }[];
  current: string;
}) {
  return (
    <nav className="mb-4 flex rounded-full border border-zinc-200 p-0.5 text-xs dark:border-zinc-700">
      {views.map((view) => {
        const href = view.id === "list" ? basePath : `${basePath}?view=${view.id}`;
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
