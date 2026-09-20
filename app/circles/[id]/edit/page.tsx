import CircleForm from "@/app/components/CircleForm";
import { getCircle } from "@/lib/circles";
import { notFound } from "next/navigation";

export default async function EditCirclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { circle, error } = await getCircle(id);
  if (error) {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-red-600">{error.message}</p>
      </main>
    );
  }
  if (!circle) notFound();
  return <CircleForm circle={circle} />;
}
