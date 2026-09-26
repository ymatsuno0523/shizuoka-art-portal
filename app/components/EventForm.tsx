"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import LabelChecks from "@/app/components/LabelChecks";
import ImageFields from "@/app/components/ImageFields";
import PdfFields from "@/app/components/PdfFields";
import SlugField from "@/app/components/SlugField";
import type { EventImage, EventRow } from "@/lib/events";
import {
  CATEGORIES,
  toDateInputValue,
  type OrgOption,
  type VenueOption,
} from "@/lib/event-form";
import { initialOrgMode, initialPlaceMode, regionOptions } from "@/lib/event-payload";
import { joinLabels, parseLabels, withUnknownLabels } from "@/lib/labels";
import {
  MAX_ATTACHMENTS,
  saveAttachments,
  type Attachment,
  type PendingAttachment,
} from "@/lib/files";
import { coordinatesFor, isMappableAddress, isMissingCoordColumn, withoutCoords } from "@/lib/geo";
import { contentHref, isMissingSlugColumn, parseSlug, slugSaveHint, withoutSlug } from "@/lib/slug";
import { replaceAppHref } from "@/lib/tab-nav";
import {
  compressImageFile,
  MAX_EVENT_IMAGES,
  storagePathFromPublicUrl,
} from "@/lib/images";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

export default function EventForm({
  venues,
  orgs,
  event,
}: {
  venues: VenueOption[];
  orgs: OrgOption[];
  event?: EventRow & { images?: EventImage[]; files?: Attachment[] };
}) {
  const isEdit = Boolean(event);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startAt, setStartAt] = useState(
    event?.start_at ? toDateInputValue(event.start_at) : "",
  );
  const [endAt, setEndAt] = useState(
    event?.end_at ? toDateInputValue(event.end_at) : "",
  );
  const [placeMode, setPlaceMode] = useState<"venue" | "text">(
    initialPlaceMode(event, venues),
  );
  const [venueOptions, setVenueOptions] = useState(venues);
  const [venueId, setVenueId] = useState(event?.venue_id ?? "");
  const [locationText, setLocationText] = useState(event?.location_text ?? "");
  const [address, setAddress] = useState(() => {
    if (event?.venue_id) {
      const venue = venues.find((item) => item.id === event.venue_id);
      if (venue?.address?.trim()) return venue.address;
    }
    return event?.address ?? "";
  });
  const [region, setRegion] = useState(event?.region || regionOptions()[0]);
  const [genre, setGenre] = useState(parseLabels(event?.genre));
  const [orgMode, setOrgMode] = useState<"org" | "text">(initialOrgMode(event, orgs));
  const [circleId, setCircleId] = useState(event?.circle_id ?? orgs[0]?.id ?? "");
  const [timeText, setTimeText] = useState(event?.time_text ?? "");
  const [scheduleNote, setScheduleNote] = useState(event?.schedule_note ?? "");
  const [feeText, setFeeText] = useState(event?.fee_text ?? "");
  const [organizer, setOrganizer] = useState(event?.organizer ?? "");
  const [supportText, setSupportText] = useState(event?.support_text ?? "");
  const [contactName, setContactName] = useState(event?.contact_name ?? "");
  const [contactPhone, setContactPhone] = useState(event?.contact_phone ?? "");
  const [contactEmail, setContactEmail] = useState(event?.contact_email ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(event?.website_url ?? "");
  const [parkingText, setParkingText] = useState(event?.parking_text ?? "");
  const [slugText, setSlugText] = useState(event?.slug ?? "");
  const [keptImages, setKeptImages] = useState<EventImage[]>(event?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [keptPdfs, setKeptPdfs] = useState<Attachment[]>(event?.files ?? []);
  const [pendingPdfs, setPendingPdfs] = useState<PendingAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    let cancelled = false;
    void supabase
      .from("venues")
      .select("id, name, region, address")
      .order("name")
      .then(({ data }) => {
        if (cancelled || !data) return;
        setVenueOptions(data);
        if (placeMode === "venue" && venueId) {
          const venue = data.find((item) => item.id === venueId);
          if (venue?.address?.trim()) setAddress(venue.address);
          if (venue?.region) setRegion(venue.region);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </main>
    );
  }

  if (!user) {
    const next = isEdit && event ? contentHref("events", event, "/edit") : "/events/new";
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
        <Link href={contentHref("events", event)} className="mt-3 inline-block text-sm text-zinc-500">
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
      setError("タイトルと開始日は必須です。");
      return;
    }

    if (genre.length === 0) {
      setError("ジャンルを1つ以上選んでください。");
      return;
    }

    const parsedSlug = parseSlug(slugText);
    if (parsedSlug.error) {
      setError(parsedSlug.error);
      return;
    }

    setSubmitting(true);
    const emptyToNull = (value: string) => value.trim() || null;
    const selectedVenue =
      placeMode === "venue" && venueId
        ? venueOptions.find((item) => item.id === venueId)
        : null;
    const locationValue = placeMode === "text" ? emptyToNull(locationText) : null;
    // 登録施設を選んでいるときは施設側の住所・座標を使う
    const addressValue = selectedVenue ? null : emptyToNull(address);
    const coords =
      addressValue && isMappableAddress(addressValue)
        ? await coordinatesFor(addressValue, region)
        : { lat: null, lng: null };
    const payload = {
      title: title.trim(),
      description: emptyToNull(description),
      start_at: startAt,
      end_at: endAt || null,
      venue_id: placeMode === "venue" ? emptyToNull(venueId) : null,
      location_text: locationValue,
      address: addressValue,
      ...coords,
      region,
      genre,
      time_text: emptyToNull(timeText),
      schedule_note: emptyToNull(scheduleNote),
      fee_text: emptyToNull(feeText),
      circle_id: orgMode === "org" && circleId ? circleId : null,
      organizer: orgMode === "text" ? emptyToNull(organizer) : null,
      support_text: emptyToNull(supportText),
      contact_name: emptyToNull(contactName),
      contact_phone: emptyToNull(contactPhone),
      contact_email: emptyToNull(contactEmail),
      website_url: emptyToNull(websiteUrl),
      parking_text: emptyToNull(parkingText),
      slug: parsedSlug.slug,
    };

    if (keptImages.length + files.length > MAX_EVENT_IMAGES) {
      setError(`画像は${MAX_EVENT_IMAGES}枚までです。`);
      return;
    }

    if (keptPdfs.length + pendingPdfs.length > MAX_ATTACHMENTS) {
      setError(`PDFは${MAX_ATTACHMENTS}件までです。`);
      return;
    }

    const supabase = createBrowserSupabase();
    const write = (body: typeof payload | ReturnType<typeof withoutCoords<typeof payload>>) =>
      isEdit && event
        ? supabase.from("events").update(body).eq("id", event.id).select("id").single()
        : supabase
            .from("events")
            .insert({
              ...body,
              created_by: user.id,
              created_at: new Date().toISOString(),
            })
            .select("id")
            .single();
    let result = await write(payload);
    if (result.error && isMissingCoordColumn(result.error.message)) {
      result = await write(withoutCoords(payload));
    }
    if (result.error && isMissingSlugColumn(result.error.message)) {
      if (parsedSlug.slug) {
        setSubmitting(false);
        setError(slugSaveHint(result.error.message) ?? result.error.message);
        return;
      }
      result = await write(withoutSlug(withoutCoords(payload)) as typeof payload);
    }

    if (result.error || !result.data) {
      setSubmitting(false);
      const message = result.error?.message ?? "保存に失敗しました。";
      const slugHint = slugSaveHint(message);
      const hint = slugHint
        ? slugHint
        : /support_text/.test(message)
          ? `${message} supabase/event-support-text.sql を実行したか確認してください。`
          : /address/.test(message)
            ? `${message} supabase/event-address.sql を実行したか確認してください。`
            : `${message} supabase/multi-labels.sql を実行したか確認してください。`;
      setError(hint);
      return;
    }

    const eventId = result.data.id;
    const savedPath = contentHref("events", { id: eventId, slug: parsedSlug.slug });
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
      replaceAppHref(router, savedPath);
      return;
    }

    try {
      await saveAttachments(supabase, {
        table: "event_files",
        idColumn: "event_id",
        entityId: eventId,
        userId: user.id,
        original: event?.files ?? [],
        kept: keptPdfs,
        pending: pendingPdfs,
      });
    } catch (fileFailed) {
      setSubmitting(false);
      setError(
        `${fileFailed instanceof Error ? fileFailed.message : "PDFの保存に失敗しました。"} supabase/attachments.sql を実行したか確認してください。`,
      );
      replaceAppHref(router, savedPath);
      return;
    }

    setSubmitting(false);
    replaceAppHref(router, savedPath);
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

        <LabelChecks
          legend="ジャンル"
          options={withUnknownLabels(CATEGORIES, genre)}
          values={genre}
          onChange={setGenre}
          hint="最大2つまで。"
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block min-w-0 text-sm">
            開始日
            <input
              required
              type="date"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="block min-w-0 text-sm">
            終了日（任意）
            <input
              type="date"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>

        <fieldset className="space-y-2 text-sm">
          <legend>会場（任意）</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="placeMode"
                className="choice-radio"
                checked={placeMode === "venue"}
                disabled={venueOptions.length === 0}
                onChange={() => setPlaceMode("venue")}
              />
              登録済み施設
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="placeMode"
                className="choice-radio"
                checked={placeMode === "text"}
                onChange={() => setPlaceMode("text")}
              />
              直接入力
            </label>
          </div>
          {placeMode === "venue" ? (
            <div className="select-field">
              <select
                value={venueId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setVenueId(nextId);
                  const venue = venueOptions.find((item) => item.id === nextId);
                  if (venue) {
                    if (venue.region) setRegion(venue.region);
                    setAddress(venue.address?.trim() ?? "");
                  } else {
                    setAddress("");
                  }
                }}
                className={inputClass}
              >
                <option value="">指定しない</option>
                {venueOptions.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <label className="block">
              会場名（任意）
              <input
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="例: ○○ホール"
                className={`${inputClass} mt-1`}
              />
            </label>
          )}
          <label className="block">
            住所（任意）
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例: 浜松市中央区中央1-1"
              readOnly={placeMode === "venue" && Boolean(venueId)}
              className={`${inputClass} mt-1 ${
                placeMode === "venue" && venueId ? "bg-zinc-100 dark:bg-zinc-900" : ""
              }`}
            />
          </label>
        </fieldset>

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
          開催時間（任意）
          <input
            value={timeText}
            onChange={(e) => setTimeText(e.target.value)}
            placeholder="例: 10:00〜17:00（最終入場 16:30）"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          開催日の補足（任意）
          <input
            value={scheduleNote}
            onChange={(e) => setScheduleNote(e.target.value)}
            placeholder="例: 月曜休、祝日は開館"
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          料金（任意）
          <input
            value={feeText}
            onChange={(e) => setFeeText(e.target.value)}
            placeholder="例: 一般 1,000円 / 無料"
            className={`${inputClass} mt-1`}
          />
        </label>

        <fieldset className="space-y-2 text-sm">
          <legend>主催（任意）</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="orgMode"
                className="choice-radio"
                checked={orgMode === "org"}
                disabled={orgs.length === 0}
                onChange={() => setOrgMode("org")}
              />
              登録済み団体
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="orgMode"
                className="choice-radio"
                checked={orgMode === "text"}
                onChange={() => setOrgMode("text")}
              />
              直接入力
            </label>
          </div>
          {orgMode === "org" ? (
            <div className="select-field">
              <select
                value={circleId}
                onChange={(e) => setCircleId(e.target.value)}
                className={inputClass}
              >
                {orgs.length === 0 ? (
                  <option value="">登録済み団体はまだありません</option>
                ) : (
                  orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                      {joinLabels(org.kind) ? `（${joinLabels(org.kind)}）` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <input
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="例: ○○実行委員会"
              className={inputClass}
            />
          )}
        </fieldset>

        <label className="block text-sm">
          共催・後援（任意）
          <textarea
            rows={3}
            value={supportText}
            onChange={(e) => setSupportText(e.target.value)}
            placeholder={"例: 共催 ○○美術館\n後援 浜松市、○○新聞"}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          問い合わせ先（任意）
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          電話（任意）
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          メール（任意）
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
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

        <label className="block text-sm">
          駐車場（任意）
          <input
            value={parkingText}
            onChange={(e) => setParkingText(e.target.value)}
            placeholder="例: 無料20台 / なし"
            className={`${inputClass} mt-1`}
          />
        </label>

        <ImageFields
          kept={keptImages}
          files={files}
          max={MAX_EVENT_IMAGES}
          onKeptChange={setKeptImages}
          onFilesChange={setFiles}
        />

        <PdfFields
          kept={keptPdfs}
          pending={pendingPdfs}
          onKeptChange={setKeptPdfs}
          onPendingChange={setPendingPdfs}
        />

        <label className="block text-sm">
          説明（任意）
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <SlugField value={slugText} onChange={setSlugText} />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="!mt-6 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitting ? "保存中..." : isEdit ? "変更を保存" : "投稿する"}
        </button>
      </form>
    </main>
  );
}
