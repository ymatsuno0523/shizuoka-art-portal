"use client";

import { useEffect, useMemo } from "react";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

function PendingThumb({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <li className="relative shrink-0">
      <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] text-white"
      >
        削除
      </button>
    </li>
  );
}

export default function ImageFields<T extends { id: string; url: string }>({
  kept,
  files,
  max,
  onKeptChange,
  onFilesChange,
}: {
  kept: T[];
  files: File[];
  max: number;
  onKeptChange: (items: T[]) => void;
  onFilesChange: (items: File[]) => void;
}) {
  const room = max - kept.length - files.length;

  return (
    <div className="space-y-2 text-sm">
      <div>
        <p>画像（任意）</p>
        <p className="mt-[10px] text-xs text-zinc-500">最大{max}枚まで</p>
      </div>
      {kept.length + files.length > 0 ? (
        <ul className="flex gap-2 overflow-x-auto">
          {kept.map((image) => (
            <li key={image.id} className="relative shrink-0">
              <img
                src={image.url}
                alt=""
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  onKeptChange(kept.filter((item) => item.id !== image.id))
                }
                className="absolute top-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] text-white"
              >
                削除
              </button>
            </li>
          ))}
          {files.map((file, index) => (
            <PendingThumb
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              file={file}
              onRemove={() =>
                onFilesChange(files.filter((_, itemIndex) => itemIndex !== index))
              }
            />
          ))}
        </ul>
      ) : null}
      {room > 0 ? (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className={inputClass}
          onChange={(event) => {
            const next = Array.from(event.target.files ?? []).slice(0, room);
            if (next.length > 0) onFilesChange([...files, ...next]);
            event.target.value = "";
          }}
        />
      ) : (
        <p className="text-xs text-zinc-500">{max}枚までです。</p>
      )}
    </div>
  );
}
