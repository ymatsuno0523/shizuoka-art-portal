import type { JSX } from "react";
import { SNS_LINKS, type SnsKey } from "@/lib/sns";
import { infoGridClass } from "@/app/components/InfoRow";

const iconClass = "h-5 w-5";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
      <path d="M4 4.5h4.1l4.05 5.55L16.7 4.5H20l-6.35 7.55L20.4 19.5h-4.15l-4.4-6.05-4.7 6.05H3.6l6.7-7.7z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
      <path d="M14.5 8.5V6.8c0-.8.5-1 1-1h1.7V3.2h-2.4c-2.6 0-4.3 1.6-4.3 4.1v1.2H8.3V11h2.2v9.8h3.1V11h2.3l.6-2.5z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
      <path d="M21.6 7.2c-.2-1.1-1.1-1.9-2.2-2.1C17.6 4.8 12 4.8 12 4.8s-5.6 0-7.4.3c-1.1.2-2 1-2.2 2.1C2.1 9 2.1 12 2.1 12s0 3 .3 4.8c.2 1.1 1.1 1.9 2.2 2.1 1.8.3 7.4.3 7.4.3s5.6 0 7.4-.3c1.1-.2 2-1 2.2-2.1.3-1.8.3-4.8.3-4.8s0-3-.3-4.8zM10 15.2V8.8L15.6 12z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
      <path d="M14.4 3.2h2.4c.2 2 1.5 3.6 3.5 4v2.4c-1.3 0-2.5-.4-3.5-1.1v6.4c0 3.3-2.7 6-6.1 5.9-3.3 0-6-2.8-5.9-6.2.1-3.2 2.8-5.8 6-5.8.4 0 .8 0 1.2.1v2.6c-.4-.2-.8-.2-1.2-.2-1.9 0-3.4 1.6-3.4 3.4S9.4 18 11.3 18s3.4-1.6 3.4-3.4z" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
      <path d="M12 3.4c-4.9 0-8.8 3.2-8.8 7.2 0 3.2 2.8 5.9 6.6 6.8.3.1.6 0 .7-.2l.2-.6c0-.2 0-.4.2-.5.1-.1.3 0 .5 0l1.2.3c3.6.1 6.6-2.7 6.6-5.8 0-4-3.9-7.2-8.8-7.2zm-4.2 5.3h1.2v3.7H7.8zm2.1 0h1.2v3.7H9.9zm3.3 0c.7 0 1.2.5 1.2 1.2v2.5h-1.2v-2.4c0-.2-.1-.3-.3-.3s-.3.1-.3.3v2.4h-1.2V8.7h1.2v.3c.2-.2.4-.3.6-.3zm2.7 0h1.2v2.5l1.3-2.5h1.3l-1.6 2.7 1.7 3h-1.4l-1.3-2.6v2.6h-1.2z" />
    </svg>
  );
}

const ICONS: Record<SnsKey, () => JSX.Element> = {
  sns_instagram: InstagramIcon,
  sns_x: XIcon,
  sns_facebook: FacebookIcon,
  sns_youtube: YouTubeIcon,
  sns_tiktok: TikTokIcon,
  sns_line: LineIcon,
};

export default function SnsIconLinks({
  urls,
}: {
  urls: Partial<Record<SnsKey, string | null | undefined>>;
}) {
  const links = SNS_LINKS.flatMap((item) => {
    const href = urls[item.key]?.trim();
    return href ? [{ ...item, href }] : [];
  });
  if (links.length === 0) return null;

  return (
    <div className={infoGridClass}>
      <dt className="text-zinc-500">SNS</dt>
      <dd className="flex flex-wrap items-center gap-3">
        {links.map((item) => {
          const Icon = ICONS[item.key];
          return (
            <a
              key={item.key}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-700 hover:text-foreground dark:text-zinc-300"
            >
              <Icon />
            </a>
          );
        })}
      </dd>
    </div>
  );
}
