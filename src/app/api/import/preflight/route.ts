import { plans, type PlanId } from "../../../../config/plans";
import { siteConfig } from "../../../../config/site";
import { MAX_IMPORT_ROWS, reviewImport } from "../../../../lib/import/preview";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return new Response("Unavailable", { status: 503 });
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

  if (Number(request.headers.get("content-length") ?? 0) > 3_000_000) {
    return new Response("Import review is too large", { status: 413 });
  }
  if (!request.body) return new Response("Invalid import review", { status: 400 });
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 3_000_000) { await reader.cancel(); return new Response("Import review is too large", { status: 413 }); }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  let rows: unknown;
  try { rows = JSON.parse(body).rows; }
  catch { return new Response("Invalid import review", { status: 400 }); }
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_IMPORT_ROWS) {
    return new Response("Import must contain 1–5,000 rows", { status: 400 });
  }
  const normalized: string[][] = [];
  for (const row of rows) {
    if (!row || typeof row.assetCode !== "string" || typeof row.name !== "string" || typeof row.category !== "string") {
      return new Response("Invalid import row", { status: 400 });
    }
    normalized.push([row.assetCode, row.name, row.category]);
  }
  const review = reviewImport([["Asset code", "Tool name", "Category"], ...normalized], { assetCode: 0, name: 1, category: 2 });

  const { data: company, error: companyError } = await supabase.from("companies")
    .select("plan").eq("id", membership.company_id).single();
  const { count, error: countError } = await supabase.from("tools")
    .select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).neq("status", "retired");
  if (companyError || countError || !company || count === null) return new Response("Workspace unavailable", { status: 503 });

  const invalidRows = new Set(review.issues.map((issue) => issue.row));
  const validCodes = normalized.filter((_, index) => !invalidRows.has(index + 2)).map((row) => row[0].trim());
  const { data: existing, error: existingError } = await supabase.rpc("import_existing_asset_codes", {
    p_company_id: membership.company_id, p_codes: validCodes,
  });
  if (existingError) return new Response("Workspace duplicate check unavailable", { status: 503 });
  const existingCodes = new Set<string>(existing ?? []);
  const duplicates = validCodes.filter((code) => existingCodes.has(code));
  const limit = plans[company.plan as PlanId]?.toolLimit ?? 0;
  const availableSlots = Math.max(0, limit - count);
  const candidates = validCodes.length - duplicates.length;
  return Response.json({ total: review.total, invalid: review.issues.length, existing: duplicates.length,
    availableSlots, candidates, withinCapacity: candidates <= availableSlots,
    existingCodeExamples: duplicates.slice(0, 10) }, { headers: { "Cache-Control": "no-store" } });
}
