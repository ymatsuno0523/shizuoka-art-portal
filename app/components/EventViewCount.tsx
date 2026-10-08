"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { tokyoTodayKey } from "@/lib/events";
import { createBrowserSupabase } from "@/lib/supabase-browser";

const MIN_DISPLAY = 10;
const storageKey = (eventId: string) => `sap.eventView.${eventId}`;

export default function EventViewCount({
  eventId,
  createdBy,
  initialCount,
}: {
  eventId: string;
  createdBy?: string | null;
  initialCount?: number | null;
}) {
  const { user, loading } = useAuth();
  const [count, setCount] = useState(
    typeof initialCount === "number" && Number.isFinite(initialCount)
      ? Math.max(0, Math.floor(initialCount))
      : 0,
  );

  useEffect(() => {
    if (loading) return;
    if (user && createdBy && user.id === createdBy) return;

    let cancelled = false;
    const today = tokyoTodayKey();
    const key = storageKey(eventId);
    try {
      if (window.localStorage.getItem(key) === today) return;
      // 先に日付を書いて、Strict Mode の二重実行や連打を抑える
      window.localStorage.setItem(key, today);
    } catch {
      // private mode などで保存できない場合も、この表示ではカウントする
    }

    void (async () => {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase.rpc("increment_event_view_count", {
        p_event_id: eventId,
      });
      if (cancelled || error) return;
      if (typeof data === "number") setCount(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [createdBy, eventId, loading, user]);

  if (count < MIN_DISPLAY) return null;

  return (
    <p className="mt-2 text-xs text-zinc-500 tabular-nums">閲覧 {count}</p>
  );
}
