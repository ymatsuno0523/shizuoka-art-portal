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

function telHref(value: string) {
  const compact = value.normalize("NFKC").replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : null;
}

export function InfoPhone({
  label = "電話",
  value,
}: {
  label?: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;
  const href = telHref(value);
  return (
    <div className={infoGridClass}>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="break-words">
        {href ? (
          <a href={href} className="underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export function InfoEmail({
  label = "メール",
  value,
}: {
  label?: string;
  value?: string | null;
}) {
  const text = value?.trim();
  if (!text) return null;
  return (
    <div className={infoGridClass}>
      <dt className="text-zinc-500">{label}</dt>
      <dd>
        <a href={`mailto:${text}`} className="break-all underline">
          {text}
        </a>
      </dd>
    </div>
  );
}
