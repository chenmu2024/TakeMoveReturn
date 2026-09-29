import { createAdminClient } from "../../../../../lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "../../../../../lib/supabase/server";
import { customerFilesEnabled, getCustomerFilesBucket } from "../../../../../lib/files/customer-files";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!customerFilesEnabled()) return new Response("Not found", { status: 404 });
  if (!isSupabaseConfigured()) return new Response("Storage unavailable", { status: 503 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return new Response("Authentication required", { status: 401 });

  const { data: record, error: lookupError } = await supabase.from("customer_files")
    .select("kind,tool_id,damage_report_id,maintenance_event_id")
    .eq("id", id)
    .eq("status", "ready")
    .maybeSingle();
  if (lookupError) return new Response("Storage unavailable", { status: 503 });
  if (!record) return new Response("Not found", { status: 404 });

  const bucket = getCustomerFilesBucket();
  if (!bucket) return new Response("Storage unavailable", { status: 503 });

  const { data: objectKey, error: deleteError } = await supabase.rpc("delete_customer_file", { p_file_id: id });
  if (deleteError || typeof objectKey !== "string") return new Response("Delete failed", { status: 403 });

  try {
    await bucket.delete(objectKey);
    const admin = createAdminClient();
    if (admin) {
      const { error: cleanupStateError } = await admin.rpc("record_customer_file_object_cleanup", {
        p_file_id: id,
        p_succeeded: true,
        p_error: null,
      });
      if (cleanupStateError) console.error(JSON.stringify({ event: "customer_file_cleanup_state_failed", fileId: id }));
    }
  } catch {
    console.error(JSON.stringify({ event: "customer_file_r2_delete_failed", fileId: id }));
  }

  const path = record.kind === "tool_photo" && record.tool_id ? `/app/tools/${record.tool_id}`
    : record.kind === "damage_photo" ? "/app/damage"
    : "/app/maintenance";
  const url = new URL(path, request.url);
  url.searchParams.set("notice", "file-deleted");
  return Response.redirect(url, 303);
}
