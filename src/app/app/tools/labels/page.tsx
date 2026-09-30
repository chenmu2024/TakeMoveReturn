import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { siteConfig } from "../../../../config/site";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { BatchLabels } from "./batch-labels";
import "./labels.css";

export const metadata: Metadata = { title: "Print QR Labels | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ job?: string; page?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: member, error: memberError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (memberError) throw new Error("Workspace membership could not be checked.");
  if (!member) redirect("/app/onboarding");

  const params = await searchParams;
  const page = Number(params.page ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || page > 10) notFound();
  const offset = (page - 1) * 200;
  let toolIds: string[] | null = null;
  let total = 0;
  if (params.job) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.job)) notFound();
    const { data: job, error: jobError } = await supabase.from("import_jobs")
      .select("id,status").eq("id", params.job).eq("company_id", member.company_id).maybeSingle();
    if (jobError) throw new Error("Import job could not be checked.");
    if (!job || job.status !== "completed") notFound();
    const { data: rows, count, error } = await supabase.from("import_rows")
      .select("tool_id", { count: "exact" }).eq("job_id", job.id).eq("status", "imported")
      .not("tool_id", "is", null).order("row_number").range(offset, offset + 199);
    if (error) throw new Error("Imported tools could not be loaded.");
    toolIds = (rows ?? []).map((row) => row.tool_id as string);
    total = count ?? 0;
  }
  const { data: tools, count, error: toolsError } = toolIds === null
    ? await supabase.from("tools").select("id,name,asset_code,qr_token", { count: "exact" })
      .eq("company_id", member.company_id).neq("status", "retired").order("name").range(offset, offset + 199)
    : toolIds.length
      ? await supabase.from("tools").select("id,name,asset_code,qr_token")
        .eq("company_id", member.company_id).in("id", toolIds)
      : { data: [], count: 0, error: null };
  if (toolsError) throw new Error("Tool labels could not be loaded.");
  const ordered = toolIds === null ? tools ?? [] : toolIds.map((id) => tools?.find((tool) => tool.id === id)).filter((tool) => tool !== undefined);
  if (toolIds === null) total = count ?? 0;
  const pageCount = Math.ceil(total / 200);
  const base = `/app/tools/labels${params.job ? `?job=${params.job}&` : "?"}page=`;

  return <main className="batch-label-page"><header><Link href={params.job ? "/app/import" : "/app/tools"}>← Back to {params.job ? "import" : "tools"}</Link><span>TakeMoveReturn</span></header>
    <div className="batch-label-intro"><p className="workspace-eyebrow">QR LABELS</p><h1>Print tool labels</h1><p>{total.toLocaleString("en-US")} tools available · page {page} of {pageCount || 1}. Select labels, preview the sheet, then print or choose “Save as PDF” in your browser.</p><p>Each QR identifies a tool; worker sign-in is still required to change custody.</p></div>
    <BatchLabels tools={ordered} siteUrl={siteConfig.siteUrl} />
    <nav className="batch-label-pages" aria-label="Label pages">{page > 1 && <Link href={`${base}${page - 1}`}>Previous 200</Link>}{page < pageCount && <Link href={`${base}${page + 1}`}>Next 200</Link>}</nav>
  </main>;
}
