import { storagePathFromPublicUrl } from "@/lib/images";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export const MAX_ATTACHMENTS = 3;
export const ATTACHMENT_BUCKET = "attachments";
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

export type Attachment = {
  id: string;
  url: string;
  label: string;
  sort_order: number | null;
};

export type PendingAttachment = {
  key: string;
  file: File;
  label: string;
};

type FileTable = "event_files" | "venue_files" | "circle_files";
type IdColumn = "event_id" | "venue_id" | "circle_id";

export function viewAttachmentUrl(url: string) {
  try {
    const next = new URL(url);
    next.searchParams.delete("download");
    return next.toString();
  } catch {
    return url;
  }
}

export function fileLabelFromName(name: string) {
  return name.replace(/\.pdf$/i, "").trim() || "資料";
}

export function sortedAttachments(rows: Attachment[] | null | undefined) {
  return [...(rows ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export async function saveAttachments(
  supabase: ReturnType<typeof createBrowserSupabase>,
  {
    table,
    idColumn,
    entityId,
    userId,
    original,
    kept,
    pending,
  }: {
    table: FileTable;
    idColumn: IdColumn;
    entityId: string;
    userId: string;
    original: Attachment[];
    kept: Attachment[];
    pending: PendingAttachment[];
  },
) {
  if (kept.length + pending.length > MAX_ATTACHMENTS) {
    throw new Error(`PDFは${MAX_ATTACHMENTS}件までです。`);
  }

  const removed = original.filter(
    (item) => !kept.some((current) => current.id === item.id),
  );
  for (const item of removed) {
    const path = storagePathFromPublicUrl(item.url, ATTACHMENT_BUCKET);
    if (path) await supabase.storage.from(ATTACHMENT_BUCKET).remove([path]);
    const { error } = await supabase.from(table).delete().eq("id", item.id);
    if (error) throw error;
  }

  for (const item of kept) {
    const { error } = await supabase
      .from(table)
      .update({ label: item.label.trim() || "資料" })
      .eq("id", item.id);
    if (error) throw error;
  }

  const folder = idColumn.replace(/_id$/, "");
  let sortOrder = kept.length;
  for (const item of pending) {
    if (!isPdfFile(item.file)) throw new Error("PDFのみアップロードできます。");
    if (item.file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error("PDFは8MBまでです。");
    }
    const path = `${userId}/${folder}/${entityId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(path, item.file, { contentType: "application/pdf", upsert: false });
    if (uploadError) throw uploadError;
    const url = supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(path).data
      .publicUrl;
    const { error } = await supabase.from(table).insert({
      [idColumn]: entityId,
      url,
      label: item.label.trim() || fileLabelFromName(item.file.name),
      sort_order: sortOrder,
      created_by: userId,
    });
    if (error) throw error;
    sortOrder += 1;
  }
}

export async function deleteStoredAttachments(
  supabase: ReturnType<typeof createBrowserSupabase>,
  table: FileTable,
  idColumn: IdColumn,
  entityId: string,
) {
  const { data } = await supabase.from(table).select("url").eq(idColumn, entityId);
  const paths = (data ?? [])
    .map((row) => storagePathFromPublicUrl(row.url as string, ATTACHMENT_BUCKET))
    .filter((path): path is string => Boolean(path));
  if (paths.length > 0) {
    await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths);
  }
}
