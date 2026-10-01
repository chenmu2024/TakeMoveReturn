import { fieldDb, fieldWorker } from "../../../../../lib/field/server";
import { customerFilesEnabled, getCustomerFilesBucket } from "../../../../../lib/files/customer-files";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!customerFilesEnabled()) return new Response("Not found", { status: 404 });
  const session = await fieldWorker();
  if (!session) return new Response("Field sign-in required", { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const db = fieldDb();
  const { data: record, error } = await db.from("customer_files")
    .select("object_key,content_type,size_bytes,tool_id,status")
    .eq("id", id).eq("kind", "tool_photo").eq("status", "ready").maybeSingle();
  if (error) return new Response("Storage unavailable", { status: 503 });
  if (!record?.tool_id) return new Response("Not found", { status: 404 });

  const { data: tool, error: toolError } = await db.from("tools")
    .select("id").eq("id", record.tool_id).eq("company_id", session.device.company_id).maybeSingle();
  if (toolError) return new Response("Storage unavailable", { status: 503 });
  if (!tool) return new Response("Not found", { status: 404 });

  const bucket = getCustomerFilesBucket();
  if (!bucket) return new Response("Storage unavailable", { status: 503 });
  const object = await bucket.get(record.object_key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": record.content_type,
    "Content-Disposition": "inline",
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  if (record.size_bytes) headers.set("Content-Length", String(record.size_bytes));
  return new Response(object.body, { status: 200, headers });
}
