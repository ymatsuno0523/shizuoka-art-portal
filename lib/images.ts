export const MAX_VENUE_IMAGES = 5;
export const MAX_EVENT_IMAGES = 5;
export const MAX_CIRCLE_IMAGES = 5;

export async function compressImageFile(file: File, maxEdge = 1600): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を処理できませんでした。");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82);
  });
  if (!blob) throw new Error("画像の圧縮に失敗しました。");

  return new File([blob], `${crypto.randomUUID()}.jpg`, { type: "image/jpeg" });
}

export function storagePathFromPublicUrl(url: string, bucket: string) {
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}
