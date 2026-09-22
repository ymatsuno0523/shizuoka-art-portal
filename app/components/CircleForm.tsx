"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import LabelChecks from "@/app/components/LabelChecks";
import ImageFields from "@/app/components/ImageFields";
import PdfFields from "@/app/components/PdfFields";
import type { CircleImage, CircleRow } from "@/lib/circles";
import { REGIONS } from "@/lib/event-form";
import { orgKindOptions, regionOptions } from "@/lib/event-payload";
import { parseLabels } from "@/lib/labels";
import {
  MAX_ATTACHMENTS,
  saveAttachments,
  type Attachment,
  type PendingAttachment,
} from "@/lib/files";
import { SNS_LINKS } from "@/lib/sns";
import { replaceAppHref } from "@/lib/tab-nav";
import {
  compressImageFile,
  MAX_CIRCLE_IMAGES,
  storagePathFromPublicUrl,
} from "@/lib/images";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

const BUCKET = "circle-images";

const emptyToNull = (value: string) => value.trim() || null;

export default function CircleForm({
  circle,
}: {
  circle?: CircleRow & { images?: CircleImage[]; files?: Attachment[] };
}) {
  const isEdit = Boolean(circle);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(circle?.name ?? "");
  const [description, setDescription] = useState(circle?.description ?? "");
  const [address, setAddress] = useState(circle?.address ?? "");
  const [region, setRegion] = useState(circle?.region || REGIONS[0]);
  const [kind, setKind] = useState(
    parseLabels(circle?.kind).length > 0 ? parseLabels(circle?.kind) : ["サークル"],
  );
  const [genre, setGenre] = useState(circle?.genre ?? "");
  const [representative, setRepresentative] = useState(circle?.representative ?? "");
  const [phone, setPhone] = useState(circle?.phone ?? "");
  const [email, setEmail] = useState(circle?.email ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(circle?.website_url ?? "");
  const [sns, setSns] = useState({
    sns_instagram: circle?.sns_instagram ?? "",
    sns_x: circle?.sns_x ?? "",
    sns_line: circle?.sns_line ?? "",
  });
  const [keptImages, setKeptImages] = useState<CircleImage[]>(circle?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [keptPdfs, setKeptPdfs] = useState<Attachment[]>(circle?.files ?? []);
  const [pendingPdfs, setPendingPdfs] = useState<PendingAttachment[]>([]);
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
          {isEdit ? "団体を編集" : "団体を登録"}
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
        <p className="text-sm text-zinc-600">この団体を編集する権限がありません。</p>
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

    if (kind.length === 0) {
      setError("種類を1つ以上選んでください。");
      return;
    }

    if (keptImages.length + files.length > MAX_CIRCLE_IMAGES) {
      setError(`画像は${MAX_CIRCLE_IMAGES}枚までです。`);
      return;
    }

    if (keptPdfs.length + pendingPdfs.length > MAX_ATTACHMENTS) {
      setError(`PDFは${MAX_ATTACHMENTS}件までです。`);
      return;
    }

    const payload = {
      name: name.trim(),
      kind,
      description: emptyToNull(description),
      address: emptyToNull(address),
      region,
      genre: emptyToNull(genre),
      representative: emptyToNull(representative),
      phone: emptyToNull(phone),
      email: emptyToNull(email),
      website_url: emptyToNull(websiteUrl),
      sns_instagram: emptyToNull(sns.sns_instagram),
      sns_x: emptyToNull(sns.sns_x),
      sns_line: emptyToNull(sns.sns_line),
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
        `${result.error?.message ?? "保存に失敗しました。"} supabase/multi-labels.sql を実行したか確認してください。`,
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
        `${imageFailed instanceof Error ? imageFailed.message : "画像の保存に失敗しました。"} 団体は保存されています。`,
      );
      replaceAppHref(router, `/circles/${circleId}`);
      return;
    }

    try {
      await saveAttachments(supabase, {
        table: "circle_files",
        idColumn: "circle_id",
        entityId: circleId,
        userId: user.id,
        original: circle?.files ?? [],
        kept: keptPdfs,
        pending: pendingPdfs,
      });
    } catch (fileFailed) {
      setSubmitting(false);
      setError(
        `${fileFailed instanceof Error ? fileFailed.message : "PDFの保存に失敗しました。"} supabase/attachments.sql を実行したか確認してください。`,
      );
      replaceAppHref(router, `/circles/${circleId}`);
      return;
    }

    setSubmitting(false);
    replaceAppHref(router, `/circles/${circleId}`);
  }

  return (
    <main className="px-4 py-6">
      <h1 className="mb-4 text-lg font-bold">
        {isEdit ? "団体を編集" : "団体を登録"}
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

        <LabelChecks
          legend="種類"
          options={orgKindOptions(kind)}
          values={kind}
          onChange={setKind}
          hint="最大2つまで。その他のみ他は選べません。"
        />

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
          <span className="select-field mt-1">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={inputClass}
            >
              {regionOptions(region).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="block text-sm">
          活動ジャンル（任意）
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="例: イラスト・水彩"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          代表（任意）
          <input
            value={representative}
            onChange={(e) => setRepresentative(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          電話（任意）
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          メール（任意）
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          HP（任意）
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://"
            className={`${inputClass} mt-1`}
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="text-sm">SNS（任意）</legend>
          {SNS_LINKS.map((item) => (
            <label key={item.key} className="block text-sm">
              {item.label}
              <input
                type="url"
                value={sns[item.key]}
                onChange={(e) =>
                  setSns((current) => ({ ...current, [item.key]: e.target.value }))
                }
                placeholder="https://"
                className={`${inputClass} mt-1`}
              />
            </label>
          ))}
        </fieldset>

        <label className="block text-sm">
          説明（任意）
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <ImageFields
          kept={keptImages}
          files={files}
          max={MAX_CIRCLE_IMAGES}
          onKeptChange={setKeptImages}
          onFilesChange={setFiles}
        />

        <PdfFields
          kept={keptPdfs}
          pending={pendingPdfs}
          onKeptChange={setKeptPdfs}
          onPendingChange={setPendingPdfs}
        />

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
