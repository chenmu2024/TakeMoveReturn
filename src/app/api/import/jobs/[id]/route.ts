import { csvDocument } from "../../../../../lib/reports/csv";
import { siteConfig } from "../../../../../config/site";
import { dispatchImport } from "../../../../../lib/import/queue";
import { createClient, isSupabaseConfigured } from "../../../../../lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

async function getJob(id: string) {
  if (!isSupabaseConfigured()) return { error: new Response("Unavailable", { status: 503 }) };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { error: new Response("Sign in required", { status: 401 }) };
  const { data: job, error } = await supabase.from("import_jobs")
    .select("id,company_id,filename,total_rows,processed_rows,imported_rows,failed_rows,status,created_at,completed_at")
    .eq("id", id).maybeSingle();
  if (error) return { error: new Response("Workspace unavailable", { status: 503 }) };
  if (!job) return { error: new Response("Import not found", { status: 404 }) };
  return { supabase, job };
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Import not found", { status: 404 });
  const result = await getJob(id);
  if (result.error) return result.error;
  const { supabase, job } = result;
  if (!supabase || !job) return new Response("Unavailable", { status: 503 });
  if (new URL(request.url).searchParams.get("format") === "csv") {
    const rows: string[][] = [];
    for (let start = 0; start < job.total_rows; start += 1000) {
      const { data, error } = await supabase.from("import_rows")
        .select("row_number,asset_code,name,category,error_message")
        .eq("job_id", id).eq("status", "failed").order("row_number").range(start, start + 999);
      if (error) return new Response("Error report unavailable", { status: 503 });
      if (!data?.length) break;
      rows.push(...data.map((row) => [row.row_number, row.asset_code, row.name, row.category ?? "", row.error_message ?? ""].map(String)));
      if (data.length < 1000) break;
    }
    return new Response(csvDocument(["Source row", "Asset code", "Tool name", "Category", "Issue"], rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="import-${id}-errors.csv"`, "Cache-Control": "no-store" },
    });
  }
  return Response.json(job, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: RouteContext) {
  if (request.headers.get("origin") !== siteConfig.siteUrl) return new Response("Invalid origin", { status: 403 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Import not found", { status: 404 });
  const result = await getJob(id);
  if (result.error) return result.error;
  const { job } = result;
  if (!job) return new Response("Unavailable", { status: 503 });
  if (job.status === "completed") return Response.json({ queued: true });
  try {
    await dispatchImport(id, job.total_rows);
    return Response.json({ queued: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ queued: false }, { status: 503 });
  }
}
