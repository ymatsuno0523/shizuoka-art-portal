import { deleteStoredAttachments } from "@/lib/files";
import { storagePathFromPublicUrl } from "@/lib/images";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type ContentKind = "event" | "venue" | "circle";

const imageTables = {
  event: { table: "event_images", column: "event_id", bucket: "event-images" },
  venue: { table: "venue_images", column: "venue_id", bucket: "venue-images" },
  circle: { table: "circle_images", column: "circle_id", bucket: "circle-images" },
} as const;

const fileTables = {
  event: { table: "event_files", column: "event_id" },
  venue: { table: "venue_files", column: "venue_id" },
  circle: { table: "circle_files", column: "circle_id" },
} as const;

const recordTables = {
  event: "events",
  venue: "venues",
  circle: "circles",
} as const;

async function removeImages(kind: ContentKind, id: string) {
  const supabase = createBrowserSupabase();
  const image = imageTables[kind];
  const { data } = await supabase.from(image.table).select("url").eq(image.column, id);
  const paths = (data ?? [])
    .map((row) => storagePathFromPublicUrl(row.url as string, image.bucket))
    .filter((path): path is string => Boolean(path));
  if (paths.length > 0) {
    await supabase.storage.from(image.bucket).remove(paths);
  }
}

export async function deleteOwnedContent(kind: ContentKind, id: string) {
  const supabase = createBrowserSupabase();
  const files = fileTables[kind];
  await deleteStoredAttachments(supabase, files.table, files.column, id);
  await removeImages(kind, id);
  const { error } = await supabase.from(recordTables[kind]).delete().eq("id", id);
  return { error: error?.message ?? null };
}
