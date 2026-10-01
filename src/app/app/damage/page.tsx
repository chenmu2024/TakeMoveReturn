import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerFilesSection, type CustomerFileView } from "../../../components/customer-files";
import { ServicePages, servicePage, type ServiceParams } from "../../../components/service-pages";
import { customerFilesEnabled } from "../../../lib/files/customer-files";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { reportDamage, resolveDamage } from "./actions";
import "../service.css";

export const metadata: Metadata = { title: "Damage reports | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function noticeMessage(notice?: string) {
  if (notice === "reported") return { role: "status" as const, text: "Report recorded and tool status updated." };
  if (notice === "resolved") return { role: "status" as const, text: "Report resolved and tool history updated." };
  if (notice === "file-uploaded") return { role: "status" as const, text: "Damage photo uploaded." };
  if (notice === "file-deleted") return { role: "status" as const, text: "Attachment deleted." };
  if (notice === "file-quota") return { role: "alert" as const, text: "Storage allowance reached. Delete files or review the workspace plan." };
  if (notice === "file-invalid-size") return { role: "alert" as const, text: "Files must be between 1 byte and 10 MB." };
  if (notice === "file-invalid-type") return { role: "alert" as const, text: "Damage evidence must be JPEG, PNG, or WebP." };
  if (notice?.startsWith("file-")) return { role: "alert" as const, text: "The photo action could not be completed. Try again." };
  if (notice === "invalid") return { role: "alert" as const, text: "Check the required fields and description length." };
  if (notice) return { role: "alert" as const, text: "The action could not be saved. Check the tool state and try again." };
  return null;
}

export default async function DamagePage({ searchParams }: { searchParams: Promise<ServiceParams> }) {
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
  const page = servicePage(params.page);
  const toolPage = servicePage(params.toolPage);
  const schedulePage = servicePage(params.schedulePage);
  const toolQuery = typeof params.toolQuery === "string" ? params.toolQuery.trim().slice(0, 100) : "";
  let selectableTools = supabase.from("tools").select("id,name,asset_code,status", { count: "exact" }).eq("company_id", member.company_id).neq("status", "retired");
  if (toolQuery) selectableTools = selectableTools.ilike("name", `%${toolQuery.replace(/[\\%_]/g, (character) => "\\" + character)}%`);
  const [toolResult, reportResult] = await Promise.all([
    selectableTools.order("name").order("id").range((toolPage - 1) * 50, toolPage * 50 - 1),
    supabase.from("damage_reports").select("id,tool_id,severity,description,status,created_at,resolved_at", { count: "exact" }).eq("company_id", member.company_id).order("created_at", { ascending: false }).order("id").range((page - 1) * 50, page * 50 - 1),
  ]);
  if (toolResult.error || reportResult.error) throw new Error("Damage records could not be loaded.");

  const tools = toolResult.data ?? [];
  const reports = reportResult.data ?? [];
  const filesEnabled = customerFilesEnabled();
  const filesByReport = new Map<string, CustomerFileView[]>();

  if (filesEnabled && reports.length) {
    const { data: fileRows, error: fileError } = await supabase.from("customer_files")
      .select("id,damage_report_id,original_name,content_type,size_bytes")
      .eq("kind", "damage_photo").eq("status", "ready")
      .in("damage_report_id", reports.map((report) => report.id))
      .order("created_at", { ascending: false });
    if (fileError) throw new Error("Damage photos could not be loaded.");
    for (const file of fileRows ?? []) {
      if (!file.damage_report_id) continue;
      const list = filesByReport.get(file.damage_report_id) ?? [];
      list.push({ id: file.id, original_name: file.original_name, content_type: file.content_type, size_bytes: Number(file.size_bytes) });
      filesByReport.set(file.damage_report_id, list);
    }
  }

  if (toolPage > Math.max(1, Math.ceil((toolResult.count ?? 0) / 50)) || page > Math.max(1, Math.ceil((reportResult.count ?? 0) / 50))) notFound();
  const recordToolIds = [...new Set(reports.map((record) => record.tool_id))];
  const recordTools = recordToolIds.length ? await supabase.from("tools").select("id,name,asset_code").eq("company_id", member.company_id).in("id", recordToolIds) : { data: [], error: null };
  if (recordTools.error) throw new Error("Record tools could not be loaded.");
  const toolNames = new Map((recordTools.data ?? []).map((tool) => [tool.id, `${tool.name} · ${tool.asset_code}`]));
  const notice = noticeMessage(params.notice);

  return <main className="service-page">
    <header><Link href="/app">← Workspace</Link><p className="service-eyebrow">TOOL EXCEPTIONS</p><h1>Damage reports</h1><p>{filesEnabled ? "Record a damaged or missing tool, add private photo evidence, and keep its resolution with the tool history." : "Record a damaged or missing tool and its resolution. Photos are not enabled yet; do not include sensitive personal information in descriptions."}</p></header>
    {notice && <p className="service-notice" role={notice.role}>{notice.text}</p>}
    <section className="service-card"><h2>Find a tool</h2><form method="get"><label htmlFor="tool-search">Search tool names</label><input id="tool-search" name="toolQuery" defaultValue={toolQuery} maxLength={100} /><button type="submit">Search tools</button></form><ServicePages params={params} parameter="toolPage" page={toolPage} count={toolResult.count ?? 0} label="Tool selection pages" /></section>
    <div className="service-grid">
      <section className="service-card"><h2>Report an issue</h2><form action={reportDamage}><label htmlFor="damage-tool">Tool</label><select id="damage-tool" name="toolId" required defaultValue=""><option value="" disabled>Select a tool</option>{tools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name} · {tool.asset_code} ({tool.status})</option>)}</select><label htmlFor="damage-severity">Severity</label><select id="damage-severity" name="severity" required defaultValue="minor"><option value="minor">Minor</option><option value="needs_repair">Needs repair</option><option value="unusable">Unusable</option><option value="lost">Missing / lost</option></select><label htmlFor="damage-description">What happened?</label><textarea id="damage-description" name="description" required minLength={3} maxLength={1000} rows={4} /><button type="submit" disabled={!tools.length}>Save report</button></form></section>
      <section className="service-card"><h2>Recent reports</h2>{reports.length ? <ul className="service-list">{reports.map((report) => <li key={report.id}><strong>{toolNames.get(report.tool_id) ?? "Tool record"}</strong><small>{report.severity.replaceAll("_", " ")} · {report.status} · {report.created_at.slice(0, 10)}</small><p>{report.description}</p>{filesEnabled && <CustomerFilesSection compact kind="damage_photo" subjectId={report.id} files={filesByReport.get(report.id) ?? []} />}{report.status === "open" && <form action={resolveDamage}><input type="hidden" name="reportId" value={report.id} /><label htmlFor={`resolution-${report.id}`}>Resolution</label><textarea id={`resolution-${report.id}`} name="resolution" required minLength={3} maxLength={1000} rows={2} /><button type="submit">Resolve report</button></form>}</li>)}</ul> : <p>No damage has been reported.</p>}<ServicePages params={params} parameter="page" page={page} count={reportResult.count ?? 0} label="Damage report pages" /></section>
    </div>
  </main>;
}
