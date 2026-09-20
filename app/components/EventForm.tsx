"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { EventImage, EventRow } from "@/lib/events";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  type VenueOption,
} from "@/lib/event-form";
import { initialPlaceMode, regionOptions } from "@/lib/event-payload";
import {
  compressImageFile,
  MAX_EVENT_IMAGES,
  storagePathFromPublicUrl,
} from "@/lib/images";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

export default function EventForm({
  venues,
  event,
}: {
  venues: VenueOption[];
  event?: EventRow & { images?: EventImage[] };
}) {
  const isEdit = Boolean(event);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startAt, setStartAt] = useState(
    event?.start_at ? toDatetimeLocalValue(event.start_at) : "",
  );
  const [endAt, setEndAt] = useState(
    event?.end_at ? toDatetimeLocalValue(event.end_at) : "",
  );
  const [placeMode, setPlaceMode] = useState<"venue" | "text">(
    initialPlaceMode(event, venues),
  );
  const [venueId, setVenueId] = useState(event?.venue_id ?? venues[0]?.id ?? "");
  const [locationText, setLocationText] = useState(event?.location_text ?? "");
  const [region, setRegion] = useState(event?.region || venues[0]?.region || regionOptions()[0]);
  const [genre, setGenre] = useState(event?.genre ?? "");
  const [medium, setMedium] = useState(event?.medium ?? "");
  const [keptImages, setKeptImages] = useState<EventImage[]>(event?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
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
    const next = isEdit && event ? `/events/${event.id}/edit` : "/events/new";
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">
          {isEdit ? "イベントを編集" : "イベントを投稿"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isEdit ? "編集" : "投稿"}するにはログインが必要です。
        </p>
        <Link
          href={`/mypage?next=${encodeURIComponent(next)}`}
          className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          ログインへ
        </Link>
      </main>
    );
  }

  if (isEdit && event?.created_by && event.created_by !== user.id) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-zinc-600">このイベントを編集する権限がありません。</p>
        <Link href={`/events/${event.id}`} className="mt-3 inline-block text-sm text-zinc-500">
          詳細へ戻る
        </Link>
      </main>
    );
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
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

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      start_at: fromDatetimeLocalValue(startAt),
      end_at: endAt ? fromDatetimeLocalValue(endAt) : null,
      venue_id: placeMode === "venue" ? venueId : null,
      location_text: placeMode === "text" ? locationText.trim() : null,
      region,
      genre: genre.trim() || null,
      medium: medium.trim() || null,
    };

    if (keptImages.length + files.length > MAX_EVENT_IMAGES) {
      setError(`画像は${MAX_EVENT_IMAGES}枚までです。`);
      return;
    }

    setSubmitting(true);
    const supabase = createBrowserSupabase();
    const result = isEdit && event
      ? await supabase.from("events").update(payload).eq("id", event.id).select("id").single()
      : await supabase
          .from("events")
          .insert({
            ...payload,
            created_by: user.id,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

    if (result.error || !result.data) {
      setSubmitting(false);
      setError(result.error?.message ?? "保存に失敗しました。");
      return;
    }

    const eventId = result.data.id;
    const bucket = "event-images";

    try {
      const removed = (event?.images ?? []).filter(
        (image) => !keptImages.some((kept) => kept.id === image.id),
      );
      for (const image of removed) {
        const path = storagePathFromPublicUrl(image.url, bucket);
        if (path) await supabase.storage.from(bucket).remove([path]);
        await supabase.from("event_images").delete().eq("id", image.id);
      }

      let sortOrder = keptImages.length;
      for (const file of files) {
        const compressed = await compressImageFile(file);
        const path = `${user.id}/${eventId}/${compressed.name}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (uploadError) throw uploadError;
        const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
        const { error: imageError } = await supabase.from("event_images").insert({
          event_id: eventId,
          url: publicUrl,
          sort_order: sortOrder,
          created_by: user.id,
        });
        if (imageError) throw imageError;
        sortOrder += 1;
      }
    } catch (imageFailed) {
      setSubmitting(false);
      setError(
        `${imageFailed instanceof Error ? imageFailed.message : "画像の保存に失敗しました。"} supabase/event-images-storage.sql を実行したか確認してください。`,
      );
      router.replace(`/events/${eventId}`);
      router.refresh();
      return;
    }

    setSubmitting(false);
    router.replace(`/events/${eventId}`);
    router.refresh();
  }

  return (
    <main className="px-4 py-6">
      <h1 className="mb-4 text-lg font-bold">
        {isEdit ? "イベントを編集" : "イベントを投稿"}
      </h1>
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
            {regionOptions(region).map((item) => (
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

        <div className="space-y-2 text-sm">
          <p>画像（任意・最大{MAX_EVENT_IMAGES}枚。自動で圧縮します）</p>
          {keptImages.length > 0 ? (
            <ul className="flex gap-2 overflow-x-auto">
              {keptImages.map((image) => (
                <li key={image.id} className="relative shrink-0">
                  <img
                    src={image.url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setKeptImages((current) =>
                        current.filter((item) => item.id !== image.id),
                      )
                    }
                    className="absolute top-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] text-white"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className={inputClass}
            onChange={(e) => {
              const room = MAX_EVENT_IMAGES - keptImages.length;
              setFiles(Array.from(e.target.files ?? []).slice(0, room));
            }}
          />
          {files.length > 0 ? (
            <p className="text-xs text-zinc-500">新規に{files.length}枚追加</p>
          ) : null}
        </div>

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
          {submitting ? "保存中..." : isEdit ? "変更を保存" : "投稿する"}
        </button>
      </form>
    </main>
  );
}
