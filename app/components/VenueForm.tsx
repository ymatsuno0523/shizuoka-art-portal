"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import LabelChecks from "@/app/components/LabelChecks";
import ImageFields from "@/app/components/ImageFields";
import PdfFields from "@/app/components/PdfFields";
import { REGIONS } from "@/lib/event-form";
import { regionOptions, venueKindOptions } from "@/lib/event-payload";
import { parseLabels } from "@/lib/labels";
import {
  MAX_ATTACHMENTS,
  saveAttachments,
  type Attachment,
  type PendingAttachment,
} from "@/lib/files";
import { SNS_LINKS } from "@/lib/sns";
import type { VenueImage, VenueRow } from "@/lib/venues";
import {
  compressImageFile,
  MAX_VENUE_IMAGES,
  storagePathFromPublicUrl,
} from "@/lib/images";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

const BUCKET = "venue-images";

const emptyToNull = (value: string) => value.trim() || null;

export default function VenueForm({
  venue,
}: {
  venue?: VenueRow & { images?: VenueImage[]; files?: Attachment[] };
}) {
  const isEdit = Boolean(venue);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(venue?.name ?? "");
  const [kind, setKind] = useState(
    parseLabels(venue?.kind).length > 0 ? parseLabels(venue?.kind) : ["ギャラリー"],
  );
  const [description, setDescription] = useState(venue?.description ?? "");
  const [address, setAddress] = useState(venue?.address ?? "");
  const [region, setRegion] = useState(venue?.region || REGIONS[0]);
  const [phone, setPhone] = useState(venue?.phone ?? "");
  const [hoursText, setHoursText] = useState(venue?.hours_text ?? "");
  const [holidayText, setHolidayText] = useState(venue?.holiday_text ?? "");
  const [feeText, setFeeText] = useState(venue?.fee_text ?? "");
  const [accessTransit, setAccessTransit] = useState(venue?.access_transit ?? "");
  const [accessCar, setAccessCar] = useState(venue?.access_car ?? "");
  const [parkingText, setParkingText] = useState(venue?.parking_text ?? "");
  const [paymentText, setPaymentText] = useState(venue?.payment_text ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(venue?.website_url ?? "");
  const [sns, setSns] = useState({
    sns_instagram: venue?.sns_instagram ?? "",
    sns_x: venue?.sns_x ?? "",
    sns_line: venue?.sns_line ?? "",
  });
  const [keptImages, setKeptImages] = useState<VenueImage[]>(venue?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [keptPdfs, setKeptPdfs] = useState<Attachment[]>(venue?.files ?? []);
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
    const next = isEdit && venue ? `/venues/${venue.id}/edit` : "/venues/new";
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">
          {isEdit ? "施設を編集" : "施設を登録"}
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

  if (isEdit && venue?.created_by && venue.created_by !== user.id) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-zinc-600">この施設を編集する権限がありません。</p>
        <Link href={`/venues/${venue.id}`} className="mt-3 inline-block text-sm text-zinc-500">
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
      setError("施設名は必須です。");
      return;
    }

    if (kind.length === 0) {
      setError("種類を1つ以上選んでください。");
      return;
    }

    if (keptImages.length + files.length > MAX_VENUE_IMAGES) {
      setError(`画像は${MAX_VENUE_IMAGES}枚までです。`);
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
      phone: emptyToNull(phone),
      hours_text: emptyToNull(hoursText),
      holiday_text: emptyToNull(holidayText),
      fee_text: emptyToNull(feeText),
      access_transit: emptyToNull(accessTransit),
      access_car: emptyToNull(accessCar),
      parking_text: emptyToNull(parkingText),
      payment_text: emptyToNull(paymentText),
      website_url: emptyToNull(websiteUrl),
      sns_instagram: emptyToNull(sns.sns_instagram),
      sns_x: emptyToNull(sns.sns_x),
      sns_line: emptyToNull(sns.sns_line),
    };

    setSubmitting(true);
    const supabase = createBrowserSupabase();
    const result =
      isEdit && venue
        ? await supabase.from("venues").update(payload).eq("id", venue.id).select("id").single()
        : await supabase
            .from("venues")
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

    const venueId = result.data.id;

    try {
      const removed = (venue?.images ?? []).filter(
        (image) => !keptImages.some((kept) => kept.id === image.id),
      );
      for (const image of removed) {
        const path = storagePathFromPublicUrl(image.url, BUCKET);
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        await supabase.from("venue_images").delete().eq("id", image.id);
      }

      let sortOrder = keptImages.length;
      for (const file of files) {
        const compressed = await compressImageFile(file);
        const path = `${user.id}/${venueId}/${compressed.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (uploadError) throw uploadError;
        const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const { error: imageError } = await supabase.from("venue_images").insert({
          venue_id: venueId,
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
        `${imageFailed instanceof Error ? imageFailed.message : "画像の保存に失敗しました。"} 施設は保存されています。`,
      );
      router.replace(`/venues/${venueId}`);
      router.refresh();
      return;
    }

    try {
      await saveAttachments(supabase, {
        table: "venue_files",
        idColumn: "venue_id",
        entityId: venueId,
        userId: user.id,
        original: venue?.files ?? [],
        kept: keptPdfs,
        pending: pendingPdfs,
      });
    } catch (fileFailed) {
      setSubmitting(false);
      setError(
        `${fileFailed instanceof Error ? fileFailed.message : "PDFの保存に失敗しました。"} supabase/attachments.sql を実行したか確認してください。`,
      );
      router.replace(`/venues/${venueId}`);
      router.refresh();
      return;
    }

    setSubmitting(false);
    router.replace(`/venues/${venueId}`);
    router.refresh();
  }

  return (
    <main className="px-4 py-6">
      <h1 className="mb-4 text-lg font-bold">
        {isEdit ? "施設を編集" : "施設を登録"}
      </h1>
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

        <LabelChecks
          legend="種類"
          options={venueKindOptions(kind)}
          values={kind}
          onChange={setKind}
          hint="最大2つまで。その他のみ他は選べません。"
        />

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
          住所（任意）
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="例: 静岡市葵区…"
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
          営業時間（任意）
          <textarea
            rows={3}
            value={hoursText}
            onChange={(e) => setHoursText(e.target.value)}
            placeholder="例: 10:00〜18:00（最終入場 17:30）"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          定休日（任意）
          <input
            value={holidayText}
            onChange={(e) => setHolidayText(e.target.value)}
            placeholder="例: 月曜休（祝日の場合は翌平日）"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          料金（任意）
          <textarea
            rows={3}
            value={feeText}
            onChange={(e) => setFeeText(e.target.value)}
            placeholder="例: 観覧無料 / 一般 500円"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          交通機関（任意）
          <textarea
            rows={3}
            value={accessTransit}
            onChange={(e) => setAccessTransit(e.target.value)}
            placeholder="例: JR静岡駅から徒歩10分"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          車（任意）
          <textarea
            rows={3}
            value={accessCar}
            onChange={(e) => setAccessCar(e.target.value)}
            placeholder="例: 東名静岡ICから約15分"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          駐車場（任意）
          <input
            value={parkingText}
            onChange={(e) => setParkingText(e.target.value)}
            placeholder="例: 20台（無料）"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          支払い方法（任意）
          <input
            value={paymentText}
            onChange={(e) => setPaymentText(e.target.value)}
            placeholder="例: 現金のみ / カード可"
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
          max={MAX_VENUE_IMAGES}
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
