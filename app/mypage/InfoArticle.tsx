import Link from "next/link";
import type { ReactNode } from "react";
import MypageSubpage from "@/app/mypage/MypageSubpage";

export default function InfoArticle({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <MypageSubpage title={title}>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </MypageSubpage>
  );
}

export function InfoLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold underline">
      {children}
    </Link>
  );
}
