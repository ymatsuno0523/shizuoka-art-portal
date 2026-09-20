"use client";

import {
  fileLabelFromName,
  isPdfFile,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  type Attachment,
  type PendingAttachment,
} from "@/lib/files";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

export default function PdfFields({
  kept,
  pending,
  onKeptChange,
  onPendingChange,
}: {
  kept: Attachment[];
  pending: PendingAttachment[];
  onKeptChange: (items: Attachment[]) => void;
  onPendingChange: (items: PendingAttachment[]) => void;
}) {
  const room = MAX_ATTACHMENTS - kept.length - pending.length;

  function addFiles(list: FileList | null) {
    if (!list || room <= 0) return;
    const next: PendingAttachment[] = [];
    for (const file of Array.from(list).slice(0, room)) {
      if (!isPdfFile(file)) continue;
      if (file.size > MAX_ATTACHMENT_BYTES) continue;
      next.push({
        key: crypto.randomUUID(),
        file,
        label: fileLabelFromName(file.name),
      });
    }
    if (next.length === 0) return;
    onPendingChange([...pending, ...next]);
  }

  return (
    <div className="space-y-2 text-sm">
      <p>PDF資料（任意・最大{MAX_ATTACHMENTS}件・各8MBまで）</p>
      <p className="text-xs text-zinc-500">
        料金表や注意事項など。リンクに出す文字を指定できます。
      </p>
      {kept.map((item) => (
        <div key={item.id} className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
          <label className="block">
            リンクの文字
            <input
              value={item.label}
              onChange={(event) =>
                onKeptChange(
                  kept.map((current) =>
                    current.id === item.id
                      ? { ...current, label: event.target.value }
                      : current,
                  ),
                )
              }
              placeholder="例: 利用料金"
              className={`${inputClass} mt-1`}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              onKeptChange(kept.filter((current) => current.id !== item.id))
            }
            className="mt-2 text-xs text-red-600"
          >
            削除
          </button>
        </div>
      ))}
      {pending.map((item) => (
        <div key={item.key} className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
          <p className="truncate text-xs text-zinc-500">{item.file.name}</p>
          <label className="mt-1 block">
            リンクの文字
            <input
              value={item.label}
              onChange={(event) =>
                onPendingChange(
                  pending.map((current) =>
                    current.key === item.key
                      ? { ...current, label: event.target.value }
                      : current,
                  ),
                )
              }
              placeholder="例: 利用料金"
              className={`${inputClass} mt-1`}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              onPendingChange(pending.filter((current) => current.key !== item.key))
            }
            className="mt-2 text-xs text-red-600"
          >
            削除
          </button>
        </div>
      ))}
      {room > 0 ? (
        <input
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className={inputClass}
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      ) : (
        <p className="text-xs text-zinc-500">3件までです。</p>
      )}
    </div>
  );
}
