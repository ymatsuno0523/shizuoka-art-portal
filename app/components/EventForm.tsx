"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import {
  fromDatetimeLocalValue,
  REGIONS,
  type VenueOption,
} from "@/lib/event-form";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

export default function EventForm({ venues }: { venues: VenueOption[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [placeMode, setPlaceMode] = useState<"venue" | "text">(
    venues.length > 0 ? "venue" : "text",
  );
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [locationText, setLocationText] = useState("");
  const [region, setRegion] = useState(venues[0]?.region || REGIONS[0]);
  const [genre, setGenre] = useState("");
  const [medium, setMedium] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">イベントを投稿</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          投稿するにはログインが必要です。
        </p>
        <Link
          href="/mypage?next=/events/new"
          className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          ログインへ
        </Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setError(null);

    if (!title.trim() || !startAt) {
      setError("タイトルと開始日時は必須です。");
      return;
    }

    if (placeMode === "venue" && !venueId) {
      setError("会場を選ぶか、手打ちに切り替えてください。");
      return;
    }

    if (placeMode === "text" && !locationText.trim()) {
      setError("場所を入力してください。");
      return;
    }

    setSubmitting(true);
    const supabase = createBrowserSupabase();
    const { data, error: insertError } = await supabase
      .from("events")
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        start_at: fromDatetimeLocalValue(startAt),
        end_at: endAt ? fromDatetimeLocalValue(endAt) : null,
        venue_id: placeMode === "venue" ? venueId : null,
        location_text: placeMode === "text" ? locationText.trim() : null,
        region,
        genre: genre.trim() || null,
        medium: medium.trim() || null,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (insertError) {
      const rlsHint =
        insertError.code === "42501" ||
        /row-level security|permission denied|RLS/i.test(insertError.message)
          ? " RLS で INSERT が拒否されている場合があります。supabase/events-write-policy.sql を確認してください。"
          : "";
      setError(`${insertError.message}${rlsHint}`);
      return;
    }

    router.push(`/events/${data.id}`);
    router.refresh();
  }

  return (
    <main className="px-4 py-6">
      <h1 className="mb-4 text-lg font-bold">イベントを投稿</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          タイトル
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          開始
          <input
            required
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          終了（任意）
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <fieldset className="space-y-2 text-sm">
          <legend>場所</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="placeMode"
              checked={placeMode === "venue"}
              disabled={venues.length === 0}
              onChange={() => setPlaceMode("venue")}
            />
            登録済み会場から選ぶ
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="placeMode"
              checked={placeMode === "text"}
              onChange={() => setPlaceMode("text")}
            />
            手打ちする（会場には登録されない）
          </label>
        </fieldset>

        {placeMode === "venue" ? (
          <label className="block text-sm">
            会場
            <select
              value={venueId}
              onChange={(e) => {
                const nextId = e.target.value;
                setVenueId(nextId);
                const venue = venues.find((item) => item.id === nextId);
                if (venue?.region) setRegion(venue.region);
              }}
              className={`${inputClass} mt-1`}
            >
              {venues.length === 0 ? (
                <option value="">登録済み会場はまだありません</option>
              ) : (
                venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))
              )}
            </select>
          </label>
        ) : (
          <label className="block text-sm">
            場所（手打ち）
            <input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="例: 浜松市内のギャラリー"
              className={`${inputClass} mt-1`}
            />
          </label>
        )}

        <label className="block text-sm">
          地域
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={`${inputClass} mt-1`}
          >
            {REGIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          ジャンル（任意）
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="例: イラスト・アート"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          画材（任意）
          <input
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            placeholder="例: 水彩"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          説明（任意）
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitting ? "投稿中..." : "投稿する"}
        </button>
      </form>
    </main>
  );
}
