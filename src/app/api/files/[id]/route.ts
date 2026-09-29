import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { customerFilesEnabled, getCustomerFilesBucket } from "../../../../lib/files/customer-files";

function safeFileName(value: string) {
  return value.replace(/[\r\n"\\]/g, "_").slice(0, 180) || "attachment";
}

function contentDisposition(value: string, disposition: "inline" | "attachment") {
  const safe = safeFileName(value);
  const ascii = safe.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(safe).replace(/['()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!customerFilesEnabled()) return new Response("Not found", { status: 404 });
  if (!isSupabaseConfigured()) return new Response("Storage unavailable", { status: 503 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const bucket = getCustomerFilesBucket();
  if (!bucket) return new Response("Storage unavailable", { status: 503 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return new Response("Authentication required", { status: 401 });

  const { data: record, error } = await supabase.from("customer_files")
    .select("object_key,original_name,content_type,size_bytes,status")
    .eq("id", id)
    .eq("status", "ready")
    .maybeSingle();

  if (error) return new Response("Storage unavailable", { status: 503 });
  if (!record) return new Response("Not found", { status: 404 });

  const object = await bucket.get(record.object_key);
  if (!object) return new Response("Not found", { status: 404 });

  const disposition = record.content_type === "application/pdf" ? "attachment" : "inline";
  const headers = new Headers({
    "Content-Type": record.content_type,
    "Content-Disposition": contentDisposition(record.original_name, disposition),
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  if (record.size_bytes) headers.set("Content-Length", String(record.size_bytes));

  return new Response(object.body, { status: 200, headers });
}
