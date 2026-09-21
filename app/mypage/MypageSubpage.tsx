import HistoryBack from "@/app/components/HistoryBack";
import type { ReactNode } from "react";

export default function MypageSubpage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="px-4 py-6">
      <HistoryBack href="/mypage">← マイページ</HistoryBack>
      <h1 className="mt-2 mb-4 text-lg font-bold">{title}</h1>
      {children}
    </main>
  );
}
