import { viewAttachmentUrl, type Attachment } from "@/lib/files";

export default function PdfLinks({ files }: { files: Attachment[] }) {
  if (files.length === 0) return null;
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 py-2 text-sm">
      <dt className="text-zinc-500">資料</dt>
      <dd className="break-words">
        {files.map((file, index) => (
          <span key={file.id}>
            {index > 0 ? "、" : null}
            <a
              href={viewAttachmentUrl(file.url)}
              type="application/pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {file.label}
            </a>
          </span>
        ))}
      </dd>
    </div>
  );
}
