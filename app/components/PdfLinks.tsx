import { viewAttachmentUrl, type Attachment } from "@/lib/files";

export default function PdfLinks({ files }: { files: Attachment[] }) {
  if (files.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-semibold">資料</h2>
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.id}>
            <a
              href={viewAttachmentUrl(file.url)}
              type="application/pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-xl border border-zinc-300 py-2.5 text-sm font-semibold dark:border-zinc-700"
            >
              {file.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
