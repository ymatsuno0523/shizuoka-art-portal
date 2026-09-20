import { createSupabaseClient } from "@/lib/supabase";

export type CircleImage = {
  id: string;
  url: string;
  sort_order: number | null;
};

export type CircleRow = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  region: string | null;
  genre: string | null;
  created_by?: string | null;
};

export type CircleWithImages = CircleRow & {
  images: CircleImage[];
};

function sortedImages(images: CircleImage[] | null) {
  return [...(images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export async function getCircles() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("circles")
    .select("id, name, description, address, region, genre, created_by, circle_images(id, url, sort_order)")
    .order("name");

  if (error) return { circles: [] as CircleWithImages[], error };

  const circles = (
    (data ?? []) as (CircleRow & { circle_images: CircleImage[] | null })[]
  ).map((circle) => ({
    ...circle,
    images: sortedImages(circle.circle_images),
  }));

  return { circles, error: null };
}

export async function getCircle(id: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("circles")
    .select("id, name, description, address, region, genre, created_by, circle_images(id, url, sort_order)")
    .eq("id", id)
    .maybeSingle();

  if (error) return { circle: null, error };
  if (!data) return { circle: null, error: null };

  const row = data as CircleRow & { circle_images: CircleImage[] | null };
  return {
    circle: {
      ...row,
      images: sortedImages(row.circle_images),
    } satisfies CircleWithImages,
    error: null,
  };
}
