export default function CategoryChip({ label }: { label?: string | null }) {
  if (!label) return null;
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-zinc-100 px-2.5 text-[10px] font-semibold leading-none text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {label}
    </span>
  );
}

export function CategoryChips({ labels }: { labels?: unknown }) {
  const items = Array.isArray(labels)
    ? labels.filter((item): item is string => typeof item === "string" && item.trim() !== "")
    : typeof labels === "string" && labels.trim()
      ? [labels.trim()]
      : [];
  if (items.length === 0) return null;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1">
      {items.map((label) => (
        <CategoryChip key={label} label={label} />
      ))}
    </span>
  );
}
