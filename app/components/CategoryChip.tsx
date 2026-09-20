export default function CategoryChip({ label }: { label?: string | null }) {
  if (!label) return null;
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-zinc-100 px-2.5 text-[10px] font-semibold leading-none text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      {label}
    </span>
  );
}
