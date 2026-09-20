export const infoGridClass =
  "grid grid-cols-[5.5rem_1fr] gap-2 py-2 text-sm";

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className={infoGridClass}>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="whitespace-pre-wrap break-words">{value}</dd>
    </div>
  );
}

export function InfoLink({
  label,
  href,
}: {
  label: string;
  href?: string | null;
}) {
  if (!href) return null;
  return (
    <div className={infoGridClass}>
      <dt className="text-zinc-500">{label}</dt>
      <dd>
        <a
          href={href}
          className="break-all underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {href}
        </a>
      </dd>
    </div>
  );
}
