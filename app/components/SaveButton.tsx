"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export const saveButtonClass = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-60 ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
      : "border-zinc-300 dark:border-zinc-700"
  }`;

export function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M7 4h10v16l-5-3.2L7 20V4z" />
    </svg>
  );
}

export default function SaveButton({
  table,
  idColumn,
  entityId,
  loginPath,
}: {
  table: "event_saves" | "venue_saves" | "circle_saves";
  idColumn: "event_id" | "venue_id" | "circle_id";
  entityId: string;
  loginPath: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let cancelled = false;

    async function load() {
      setAvailable(true);
      if (!user) {
        setSaved(false);
        setError(null);
        setReady(true);
        return;
      }
      const { error: probeError } = await supabase.from(table).select(idColumn).limit(1);
      if (cancelled) return;
      if (probeError) {
        setError("保存を使うには supabase/event-reactions.sql を実行してください。");
        setAvailable(false);
        setReady(true);
        return;
      }
      const { data, error: rowError } = await supabase
        .from(table)
        .select(idColumn)
        .eq(idColumn, entityId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setSaved(Boolean(data));
      setError(rowError?.message ?? null);
      setReady(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [entityId, idColumn, table, user]);

  async function toggle() {
    if (loading) return;
    if (!user) {
      router.push(`/mypage?next=${encodeURIComponent(loginPath)}`);
      return;
    }
    const supabase = createBrowserSupabase();
    setBusy(true);
    setError(null);
    if (saved) {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq(idColumn, entityId)
        .eq("user_id", user.id);
      setBusy(false);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      setSaved(false);
      return;
    }
    const { error: insertError } = await supabase
      .from(table)
      .insert({ [idColumn]: entityId, user_id: user.id });
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setSaved(true);
  }

  return (
    <div>
      <button
        type="button"
        disabled={!ready || !available || busy}
        onClick={() => void toggle()}
        className={saveButtonClass(saved)}
        aria-pressed={saved}
      >
        <BookmarkIcon filled={saved} />
        保存
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
