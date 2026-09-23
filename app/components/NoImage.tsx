export default function NoImage({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 ${className}`}
      aria-hidden
    >
      <span className="site-title px-1 text-center text-[10px] leading-tight tracking-wide">
        No Image
      </span>
    </div>
  );
}
