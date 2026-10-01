import Link from "next/link";
import type { CustomerFileKind } from "../lib/files/customer-files";

export type CustomerFileView = {
  id: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 ** 2)).toFixed(1)} MB`;
}

export function CustomerFilesSection({
  kind,
  subjectId,
  files,
  compact = false,
}: {
  kind: CustomerFileKind;
  subjectId: string;
  files: CustomerFileView[];
  compact?: boolean;
}) {
  const accept = kind === "maintenance_attachment"
    ? "image/jpeg,image/png,image/webp,application/pdf"
    : "image/jpeg,image/png,image/webp";
  const label = kind === "maintenance_attachment" ? "Add attachment" : "Add photo";
  const maxFiles = kind === "tool_photo" ? 1 : 3;
  const maxSize = kind === "maintenance_attachment" ? "10 MB" : "5 MB";
  const atLimit = files.length >= maxFiles;

  return <section className={compact ? "customer-files compact" : "customer-files"}>
    <div className="customer-files-heading">
      <strong>{kind === "maintenance_attachment" ? "Attachments" : "Photos"}</strong>
      <span>{maxSize} max per file · {maxFiles} max</span>
    </div>
    {files.length ? <ul className="customer-file-list">{files.map((file) => <li key={file.id}>
      <div>
        <Link href={`/api/files/${file.id}`} target="_blank" rel="noreferrer">{file.original_name}</Link>
        <small>{file.content_type} · {formatBytes(file.size_bytes)}</small>
      </div>
      <form method="post" action={`/api/files/${file.id}/delete`}>
        <button type="submit">Delete</button>
      </form>
    </li>)}</ul> : <p className="customer-files-empty">No files attached.</p>}
    {atLimit ? <p className="customer-files-empty">Attachment limit reached. Delete an existing file before adding another.</p> : <form className="customer-file-upload" method="post" action="/api/files/upload" encType="multipart/form-data">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <label>
        <span className="sr-only">{label}</span>
        <input name="file" type="file" accept={accept} required />
      </label>
      <button type="submit">{label}</button>
    </form>}
  </section>;
}
