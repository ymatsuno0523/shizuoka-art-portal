import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center px-4 py-16 text-center">
      <p className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        404
      </p>
      <h1 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        お探しのページが見つかりません
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        URLが変わったか、削除された可能性があります。
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        トップへ戻る
      </Link>
    </main>
  );
}
