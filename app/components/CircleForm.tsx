"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { CircleImage, CircleRow } from "@/lib/circles";
import { REGIONS } from "@/lib/event-form";
import { regionOptions } from "@/lib/event-payload";
import {
  compressImageFile,
  MAX_CIRCLE_IMAGES,
  storagePathFromPublicUrl,
} from "@/lib/images";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

const BUCKET = "circle-images";

export default function CircleForm({
  circle,
}: {
  circle?: CircleRow & { images?: CircleImage[] };
}) {
  const isEdit = Boolean(circle);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(circle?.name ?? "");
  const [description, setDescription] = useState(circle?.description ?? "");
  const [address, setAddress] = useState(circle?.address ?? "");
  const [region, setRegion] = useState(circle?.region || REGIONS[0]);
  const [genre, setGenre] = useState(circle?.genre ?? "");
  const [keptImages, setKeptImages] = useState<CircleImage[]>(circle?.images ?? []);
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
    const next = isEdit && circle ? `/circles/${circle.id}/edit` : "/circles/new";
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">
          {isEdit ? "サークルを編集" : "サークル・教室を登録"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          登録するにはログインが必要です。
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

  if (isEdit && circle?.created_by && circle.created_by !== user.id) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-zinc-600">このサークルを編集する権限がありません。</p>
        <Link href={`/circles/${circle.id}`} className="mt-3 inline-block text-sm text-zinc-500">
          詳細へ戻る
        </Link>
      </main>
    );
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!user) return;
    setError(null);

    if (!name.trim()) {
      setError("名前は必須です。");
      return;
    }

    if (keptImages.length + files.length > MAX_CIRCLE_IMAGES) {
      setError(`画像は${MAX_CIRCLE_IMAGES}枚までです。`);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      address: address.trim() || null,
      region,
      genre: genre.trim() || null,
    };

    setSubmitting(true);
    const supabase = createBrowserSupabase();
    const result =
      isEdit && circle
        ? await supabase.from("circles").update(payload).eq("id", circle.id).select("id").single()
        : await supabase
            .from("circles")
            .insert({
              ...payload,
              created_by: user.id,
              created_at: new Date().toISOString(),
            })
            .select("id")
            .single();

    if (result.error || !result.data) {
      setSubmitting(false);
      setError(
        `${result.error?.message ?? "保存に失敗しました。"} supabase/circles.sql を実行したか確認してください。`,
      );
      return;
    }

    const circleId = result.data.id;

    try {
      const removed = (circle?.images ?? []).filter(
        (image) => !keptImages.some((kept) => kept.id === image.id),
      );
      for (const image of removed) {
        const path = storagePathFromPublicUrl(image.url, BUCKET);
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        await supabase.from("circle_images").delete().eq("id", image.id);
      }

      let sortOrder = keptImages.length;
      for (const file of files) {
        const compressed = await compressImageFile(file);
        const path = `${user.id}/${circleId}/${compressed.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (uploadError) throw uploadError;
        const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const { error: imageError } = await supabase.from("circle_images").insert({
          circle_id: circleId,
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
        `${imageFailed instanceof Error ? imageFailed.message : "画像の保存に失敗しました。"} サークルは保存されています。`,
      );
      router.replace(`/circles/${circleId}`);
      router.refresh();
      return;
    }

    setSubmitting(false);
    router.replace(`/circles/${circleId}`);
    router.refresh();
  }

  return (
    <main className="px-4 py-6">
      <h1 className="mb-4 text-lg font-bold">
        {isEdit ? "サークルを編集" : "サークル・教室を登録"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          名前
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          活動場所（任意）
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="例: 静岡市葵区…"
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
            placeholder="例: イラスト・水彩"
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

        <div className="space-y-2 text-sm">
          <p>画像（任意・最大{MAX_CIRCLE_IMAGES}枚。自動で圧縮します）</p>
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
              const room = MAX_CIRCLE_IMAGES - keptImages.length;
              setFiles(Array.from(e.target.files ?? []).slice(0, room));
            }}
          />
          {files.length > 0 ? (
            <p className="text-xs text-zinc-500">新規に{files.length}枚追加</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitting ? "保存中..." : isEdit ? "変更を保存" : "登録する"}
        </button>
      </form>
    </main>
  );
}
