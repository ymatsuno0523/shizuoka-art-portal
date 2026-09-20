"use client";

import { useEffect, useState, type ReactNode, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type Kind = "event" | "venue" | "circle";

const TABLES = {
  event: { going: "event_going", saved: "event_saves", column: "event_id" },
  venue: { going: null, saved: "venue_saves", column: "venue_id" },
  circle: { going: null, saved: "circle_saves", column: "circle_id" },
} as const;

export default function MineGate<T extends { id: string }>(
  props: {
    items: T[];
    kind: Kind;
    going?: boolean;
    saved?: boolean;
    children: (items: T[]) => ReactNode;
  },
) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">読み込み中...</p>}>
      <MineGateInner {...props} />
    </Suspense>
  );
}

function MineGateInner<T extends { id: string }>({
  items,
  kind,
  going,
  saved,
  children,
}: {
  items: T[];
  kind: Kind;
  going?: boolean;
  saved?: boolean;
  children: (items: T[]) => ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [goingIds, setGoingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const mine = Boolean(going || saved);

  useEffect(() => {
    if (!mine) {
      setReady(true);
      return;
    }
    if (loading) return;
    if (!user) {
      setGoingIds(new Set());
      setSavedIds(new Set());
      setReady(true);
      return;
    }

    const supabase = createBrowserSupabase();
    const spec = TABLES[kind];
    const uid = user.id;
    let cancelled = false;

    async function load() {
      const [goingResult, saveResult] = await Promise.all([
        going && spec.going
          ? supabase.from(spec.going).select(spec.column).eq("user_id", uid)
          : Promise.resolve({ data: [] as Record<string, string>[] | null }),
        saved
          ? supabase.from(spec.saved).select(spec.column).eq("user_id", uid)
          : Promise.resolve({ data: [] as Record<string, string>[] | null }),
      ]);
      if (cancelled) return;
      setGoingIds(
        new Set((goingResult.data ?? []).map((row) => row[spec.column] as string)),
      );
      setSavedIds(
        new Set((saveResult.data ?? []).map((row) => row[spec.column] as string)),
      );
      setReady(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [going, kind, loading, mine, saved, user]);

  if (!mine) return children(items);

  if (loading || !ready) {
    return <p className="text-sm text-zinc-500">読み込み中...</p>;
  }

  if (!user) {
    const next = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return (
      <p className="text-sm text-zinc-500">
        行きたい・保存の絞り込みにはログインが必要です。
        <Link
          href={`/mypage?next=${encodeURIComponent(next)}`}
          className="ml-1 font-semibold underline"
        >
          ログインへ
        </Link>
      </p>
    );
  }

  const filtered = items.filter((item) => {
    if (going && !goingIds.has(item.id)) return false;
    if (saved && !savedIds.has(item.id)) return false;
    return true;
  });

  return children(filtered);
}
