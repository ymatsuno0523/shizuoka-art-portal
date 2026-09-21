"use client";

import { useState } from "react";
import {
  fileLabelFromName,
  isPdfFile,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_MB,
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
  const [sizeError, setSizeError] = useState<string | null>(null);

  function addFiles(list: FileList | null) {
    if (!list || room <= 0) return;
    const next: PendingAttachment[] = [];
    let tooBig = false;
    for (const file of Array.from(list).slice(0, room)) {
      if (!isPdfFile(file)) continue;
      if (file.size > MAX_ATTACHMENT_BYTES) {
        tooBig = true;
        continue;
      }
      next.push({
        key: crypto.randomUUID(),
        file,
        label: fileLabelFromName(file.name),
      });
    }
    setSizeError(tooBig ? `PDFは${MAX_ATTACHMENT_MB}MBまでです。` : null);
    if (next.length === 0) return;
    onPendingChange([...pending, ...next]);
  }

  return (
    <div className="space-y-2 text-sm">
      <div>
        <p>PDF資料（任意）</p>
        <p className="mt-[10px] text-xs text-zinc-500">
          最大{MAX_ATTACHMENTS}件・各{MAX_ATTACHMENT_MB}MBまで。テキストは変更できます。
        </p>
      </div>
      {sizeError ? <p className="text-xs text-red-600">{sizeError}</p> : null}
      {kept.map((item) => (
        <div key={item.id} className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
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
            className={inputClass}
          />
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
