"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { REGIONS } from "@/lib/event-form";
import { compressImageFile, MAX_VENUE_IMAGES } from "@/lib/images";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

const BUCKET = "venue-images";

export default function VenueForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState<string>(REGIONS[0]);
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
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">会場・施設を登録</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          登録するにはログインが必要です。
        </p>
        <Link
          href="/mypage?next=/venues/new"
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

    if (!name.trim()) {
      setError("施設名は必須です。");
      return;
    }

    if (files.length > MAX_VENUE_IMAGES) {
      setError(`画像は${MAX_VENUE_IMAGES}枚までです。`);
      return;
    }

    setSubmitting(true);
    const supabase = createBrowserSupabase();
    const { data: venue, error: insertError } = await supabase
      .from("venues")
      .insert({
        name: name.trim(),
        address: address.trim() || null,
        region,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !venue) {
      setSubmitting(false);
      setError(insertError?.message ?? "会場の登録に失敗しました。");
      return;
    }

    try {
      for (const [index, file] of files.entries()) {
        const compressed = await compressImageFile(file);
        const path = `${user.id}/${venue.id}/${compressed.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: imageError } = await supabase.from("venue_images").insert({
          venue_id: venue.id,
          url: publicUrl.publicUrl,
          sort_order: index,
          created_by: user.id,
        });
        if (imageError) throw imageError;
      }
    } catch (uploadFailed) {
      setSubmitting(false);
      const message =
        uploadFailed instanceof Error ? uploadFailed.message : "画像の保存に失敗しました。";
      setError(
        `${message} 会場は登録されています。Storage のバケツ venue-images とポリシーを確認してください。`,
      );
      router.push(`/venues/${venue.id}`);
      router.refresh();
      return;
    }

    setSubmitting(false);
    router.push(`/venues/${venue.id}`);
    router.refresh();
  }

  return (
    <main className="px-4 py-6">
      <h1 className="mb-4 text-lg font-bold">会場・施設を登録</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          施設名
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          住所（任意）
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

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
          画像（任意・最大{MAX_VENUE_IMAGES}枚。自動で圧縮します）
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className={`${inputClass} mt-1`}
            onChange={(e) => {
              const next = Array.from(e.target.files ?? []).slice(0, MAX_VENUE_IMAGES);
              setFiles(next);
            }}
          />
        </label>
        {files.length > 0 ? (
          <p className="text-xs text-zinc-500">{files.length}枚選択中</p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>
      </form>
    </main>
  );
}
