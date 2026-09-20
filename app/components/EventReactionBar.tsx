"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function EventReactionBar({
  eventId,
  createdBy,
}: {
  eventId: string;
  createdBy?: string | null;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const loginNext = `/mypage?next=${encodeURIComponent(`/events/${eventId}`)}`;
  const isOwner = Boolean(user && createdBy && user.id === createdBy);

  const [going, setGoing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [busy, setBusy] = useState<"going" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let cancelled = false;

    async function load() {
      const { error: countError } = await supabase.rpc(
        "event_going_count",
        { p_event_id: eventId },
      );
      if (cancelled) return;
      if (countError) {
        setError("行きたい・保存を使うには supabase/event-reactions.sql を実行してください。");
        setAvailable(false);
        setReady(true);
        return;
      }
      setAvailable(true);

      if (!user) {
        setGoing(false);
        setSaved(false);
        setPeople([]);
        setError(null);
        setReady(true);
        return;
      }

      const [goingResult, saveResult] = await Promise.all([
        supabase
          .from("event_going")
          .select("user_id")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("event_saves")
          .select("user_id")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setGoing(Boolean(goingResult.data));
      setSaved(Boolean(saveResult.data));

      if (user.id === createdBy) {
        const { data: rows } = await supabase
          .from("event_going")
          .select("user_id")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false });
        const ids = [...new Set((rows ?? []).map((row) => row.user_id as string))];
        if (ids.length === 0) {
          setPeople([]);
        } else {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", ids);
          const names = new Map(
            (profiles ?? []).map((profile) => [
              profile.id as string,
              (profile.display_name as string | null)?.trim() || "名前未設定",
            ]),
          );
          setPeople(ids.map((id) => ({ id, name: names.get(id) ?? "名前未設定" })));
        }
      } else {
        setPeople([]);
      }

      setError(goingResult.error?.message ?? saveResult.error?.message ?? null);
      setReady(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [createdBy, eventId, user]);

  function requireLogin() {
    router.push(loginNext);
  }

  async function toggleGoing() {
    if (loading) return;
    if (!user) {
      requireLogin();
      return;
    }
    const supabase = createBrowserSupabase();
    setBusy("going");
    setError(null);
    if (going) {
      const { error: deleteError } = await supabase
        .from("event_going")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);
      setBusy(null);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      setGoing(false);
      setPeople((current) => current.filter((person) => person.id !== user.id));
      return;
    }
    const { error: insertError } = await supabase
      .from("event_going")
      .insert({ event_id: eventId, user_id: user.id });
    setBusy(null);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setGoing(true);
    if (isOwner) {
      setPeople((current) =>
        current.some((person) => person.id === user.id)
          ? current
          : [{ id: user.id, name: "自分" }, ...current],
      );
    }
  }

  async function toggleSave() {
    if (loading) return;
    if (!user) {
      requireLogin();
      return;
    }
    const supabase = createBrowserSupabase();
    setBusy("save");
    setError(null);
    if (saved) {
      const { error: deleteError } = await supabase
        .from("event_saves")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);
      setBusy(null);
      if (deleteError) {
        setError(deleteError.message);
        return;
      }
      setSaved(false);
      return;
    }
    const { error: insertError } = await supabase
      .from("event_saves")
      .insert({ event_id: eventId, user_id: user.id });
    setBusy(null);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setSaved(true);
  }

  const buttonClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-60 ${
      active
        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
        : "border-zinc-300 dark:border-zinc-700"
    }`;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!ready || !available || busy !== null}
          onClick={() => void toggleGoing()}
          className={buttonClass(going)}
          aria-pressed={going}
        >
          <FlagIcon filled={going} />
          行きたい
        </button>
        <button
          type="button"
          disabled={!ready || !available || busy !== null}
          onClick={() => void toggleSave()}
          className={buttonClass(saved)}
          aria-pressed={saved}
        >
          <BookmarkIcon filled={saved} />
          保存
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {isOwner && people.length > 0 ? (
        <ul className="mt-2 space-y-0.5 text-sm">
          {people.map((person) => (
            <li key={person.id}>{person.name}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FlagIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
    >
      <path d="M5 21V4" />
      <path d="M5 5h12l-2 3.5L17 12H5" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
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
