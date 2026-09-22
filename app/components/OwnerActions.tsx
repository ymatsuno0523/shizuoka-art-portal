"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { deleteOwnedContent } from "@/lib/delete-content";

const confirmMessage = {
  event: "このイベントを削除しますか？",
  venue: "この施設を削除しますか？画像とPDFも一緒に消えます。",
  circle: "この団体を削除しますか？画像とPDFも一緒に消えます。",
} as const;

export default function OwnerActions({
  kind,
  id,
  editHref,
  createdBy,
  listHref,
}: {
  kind: keyof typeof confirmMessage;
  id: string;
  editHref: string;
  createdBy?: string | null;
  listHref: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !user || !createdBy || user.id !== createdBy) return null;

  async function handleDelete() {
    if (!confirm(confirmMessage[kind])) return;
    setDeleting(true);
    setError(null);
    const result = await deleteOwnedContent(kind, id);
    if (result.error) {
      setDeleting(false);
      setError(result.error);
      return;
    }
    router.replace(listHref);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-3">
        <Link
          href={editHref}
          className="inline-flex min-w-32 items-center justify-center rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          編集
        </Link>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="inline-flex min-w-32 items-center justify-center rounded-xl border border-red-600 px-6 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
        >
          削除
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
