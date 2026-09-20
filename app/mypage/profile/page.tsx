"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { compressImageFile, storagePathFromPublicUrl } from "@/lib/images";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

const BUCKET = "avatars";

type Profile = {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function ProfileForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }

    const supabase = createBrowserSupabase();
    supabase
      .from("profiles")
      .select("display_name, bio, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setLoadError(fetchError.message);
        } else if (data) {
          const profile = data as Profile;
          setDisplayName(profile.display_name ?? "");
          setBio(profile.bio ?? "");
          setAvatarUrl(profile.avatar_url);
        }
        setReady(true);
      });
  }, [user]);

  if (loading || !ready) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-4 py-6">
        <h1 className="mb-3 text-lg font-bold">プロフィールを編集</h1>
        <p className="text-sm text-zinc-600">ログインが必要です。</p>
        <Link
          href="/mypage?next=/mypage/profile"
          className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          ログインへ
        </Link>
      </main>
    );
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!user) return;
    setError(null);
    setSubmitting(true);

    const supabase = createBrowserSupabase();
    let nextAvatarUrl = avatarUrl;

    try {
      if (file) {
        const compressed = await compressImageFile(file, 800);
        const path = `${user.id}/${compressed.name}`;
        if (avatarUrl) {
          const oldPath = storagePathFromPublicUrl(avatarUrl, BUCKET);
          if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
        }
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, compressed, { contentType: "image/jpeg", upsert: true });
        if (uploadError) throw uploadError;
        nextAvatarUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const { error: saveError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: nextAvatarUrl,
        updated_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;
    } catch (saveFailed) {
      setSubmitting(false);
      setError(
        saveFailed instanceof Error
          ? saveFailed.message
          : "保存に失敗しました。supabase/profiles.sql を実行したか確認してください。",
      );
      return;
    }

    setSubmitting(false);
    router.push("/mypage");
    router.refresh();
  }

  return (
    <main className="px-4 py-6">
      <Link href="/mypage" className="text-sm text-zinc-500">
        ← マイページ
      </Link>
      <h1 className="mt-3 mb-4 text-lg font-bold">プロフィールを編集</h1>
      {loadError ? <p className="mb-3 text-sm text-red-600">{loadError}</p> : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-20 w-20 rounded-full object-contain"
          />
        ) : null}

        <label className="block text-sm">
          表示名
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          自己紹介（任意）
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>

        <label className="block text-sm">
          プロフィール画像（任意・1枚）
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={`${inputClass} mt-1`}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitting ? "保存中..." : "保存する"}
        </button>
      </form>
    </main>
  );
}
