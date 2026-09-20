"use client";

import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";

export default function OwnerEventEditLink({
  eventId,
  createdBy,
}: {
  eventId: string;
  createdBy?: string | null;
}) {
  const { user, loading } = useAuth();
  if (loading || !user || !createdBy || user.id !== createdBy) return null;

  return (
    <Link
      href={`/events/${eventId}/edit`}
      className="inline-flex min-w-40 items-center justify-center rounded-xl bg-zinc-900 px-8 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
    >
      編集
    </Link>
  );
}
