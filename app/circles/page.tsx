import Link from "next/link";
import { getCircles } from "@/lib/circles";

export default async function CirclesPage() {
  const { circles, error } = await getCircles();

  if (error) {
    return (
      <main className="px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold">サークル・教室</h1>
          <Link
            href="/circles/new"
            className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            登録する
          </Link>
        </div>
        <p className="text-sm text-red-600">読み込みに失敗しました: {error.message}</p>
        <p className="mt-2 text-xs text-zinc-500">
          supabase/circles.sql を実行していない場合があります。
        </p>
      </main>
    );
  }

  return (
    <main className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">サークル・教室</h1>
        <Link
          href="/circles/new"
          className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          登録する
        </Link>
      </div>
      {circles.length === 0 ? (
        <p className="text-sm text-zinc-500">まだサークルがありません。</p>
      ) : (
        <ul className="space-y-3">
          {circles.map((circle) => (
            <li key={circle.id}>
              <Link
                href={`/circles/${circle.id}`}
                className="flex rounded-[8px] border border-zinc-200 p-2 dark:border-zinc-800"
              >
                {circle.images[0] ? (
                  <img
                    src={circle.images[0].url}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-[6px] object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 shrink-0 rounded-[6px] bg-zinc-100 dark:bg-zinc-800" />
                )}
                <div className="min-w-0 flex-1 px-3 py-2">
                  <p className="font-semibold">{circle.name}</p>
                  <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                    {circle.region}
                    {circle.genre ? ` · ${circle.genre}` : ""}
                    {circle.address ? ` · ${circle.address}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
