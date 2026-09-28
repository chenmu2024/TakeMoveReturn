import { siteConfig } from "../../../../config/site";
import { MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, reviewImport } from "../../../../lib/import/preview";
import { dispatchImport } from "../../../../lib/import/queue";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) return new Response("Unavailable", { status: 503 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return new Response("Sign in required", { status: 401 });
  const { data: membership, error: memberError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (memberError) return new Response("Workspace unavailable", { status: 503 });
  if (!membership) return new Response("Manager access required", { status: 403 });
  const { data, error } = await supabase.from("import_jobs")
    .select("id,filename,total_rows,processed_rows,imported_rows,failed_rows,status,created_at")
    .eq("company_id", membership.company_id).order("created_at", { ascending: false }).limit(10);
  if (error) return new Response("Import history unavailable", { status: 503 });
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return new Response("Unavailable", { status: 503 });
  if (request.headers.get("origin") !== siteConfig.siteUrl) return new Response("Invalid origin", { status: 403 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return new Response("Sign in required", { status: 401 });
  const { data: acceptance, error: acceptanceError } = await supabase.from("legal_acceptances")
    .select("terms_version,privacy_version").eq("user_id", claims.claims.sub).maybeSingle();
  if (acceptanceError) return new Response("Account verification unavailable", { status: 503 });
  if (acceptance?.terms_version !== siteConfig.legal.effectiveDate ||
    acceptance?.privacy_version !== siteConfig.legal.effectiveDate) {
    return new Response("Review current terms before continuing", { status: 403 });
  }
  const { data: membership, error: memberError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (memberError) return new Response("Workspace unavailable", { status: 503 });
  if (!membership) return new Response("Manager access required", { status: 403 });

  if (Number(request.headers.get("content-length") ?? 0) > 3_000_000 || !request.body) {
    return new Response("Import is too large", { status: 413 });
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 3_000_000) { await reader.cancel(); return new Response("Import is too large", { status: 413 }); }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  let payload: { rows?: unknown; filename?: unknown; fileSize?: unknown };
  try { payload = JSON.parse(body); }
  catch { return new Response("Invalid import", { status: 400 }); }
  if (typeof payload.filename !== "string" || !payload.filename.trim() || payload.filename.length > 255 ||
    typeof payload.fileSize !== "number" || !Number.isInteger(payload.fileSize) ||
    payload.fileSize < 1 || payload.fileSize > MAX_IMPORT_BYTES ||
    !Array.isArray(payload.rows) || payload.rows.length < 1 || payload.rows.length > MAX_IMPORT_ROWS) {
    return new Response("Invalid import", { status: 400 });
  }
  const normalized: string[][] = [];
  for (const row of payload.rows) {
    if (!row || typeof row.assetCode !== "string" || typeof row.name !== "string" || typeof row.category !== "string") {
      return new Response("Invalid import row", { status: 400 });
    }
    normalized.push([row.assetCode, row.name, row.category]);
  }
  const review = reviewImport([["Asset code", "Tool name", "Category"], ...normalized],
    { assetCode: 0, name: 1, category: 2 });
  if (review.issues.length) return Response.json({ error: "Resolve invalid or duplicate rows before importing.", issues: review.issues.slice(0, 20) }, { status: 422 });

  const { data: jobId, error } = await supabase.rpc("create_import_job", {
    p_company_id: membership.company_id, p_filename: payload.filename.trim(),
    p_file_size: payload.fileSize, p_rows: review.normalizedRows,
  });
  if (error) {
    if (/limit|duplicate|already exists/i.test(error.message)) return new Response(error.message, { status: 409 });
    return new Response("Import could not start", { status: 503 });
  }
  try {
    await dispatchImport(jobId, review.total);
    return Response.json({ id: jobId, queued: true }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ id: jobId, queued: false }, { status: 202, headers: { "Cache-Control": "no-store" } });
  }
}
