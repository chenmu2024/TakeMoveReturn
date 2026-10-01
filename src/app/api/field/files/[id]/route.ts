import { customerFilesEnabled, getCustomerFilesBucket } from "../../../../../lib/files/customer-files";
import { fieldDb, fieldWorker } from "../../../../../lib/field/server";

function safeFileName(value: string) {
  return value.replace(/[\r\n"\\]/g, "_").slice(0, 180) || "tool-photo";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!customerFilesEnabled()) return new Response("Not found", { status: 404 });
  const session = await fieldWorker();
  if (!session) return new Response("Authentication required", { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const bucket = getCustomerFilesBucket();
  if (!bucket) return new Response("Storage unavailable", { status: 503 });

  const { data: record, error } = await fieldDb().from("customer_files")
    .select("company_id,object_key,original_name,content_type,size_bytes,status")
    .eq("id", id).eq("company_id", session.device.company_id)
    .eq("kind", "tool_photo").eq("status", "ready").maybeSingle();
  if (error) return new Response("Storage unavailable", { status: 503 });
  if (!record) return new Response("Not found", { status: 404 });

  const object = await bucket.get(record.object_key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": record.content_type,
    "Content-Disposition": `inline; filename="${safeFileName(record.original_name)}"`,
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  if (record.size_bytes) headers.set("Content-Length", String(record.size_bytes));
  return new Response(object.body, { status: 200, headers });
}
