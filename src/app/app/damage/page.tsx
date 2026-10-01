import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerFilesSection, type CustomerFileView } from "../../../components/customer-files";
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
  if (notice === "file-invalid-size") return { role: "alert" as const, text: "Damage photos must be between 1 byte and 5 MB." };
  if (notice === "file-invalid-type") return { role: "alert" as const, text: "Damage evidence must be JPEG, PNG, or WebP." };
  if (notice === "file-limit") return { role: "alert" as const, text: "A damage report can have up to three photos. Delete one before uploading another." };
  if (notice?.startsWith("file-")) return { role: "alert" as const, text: "The photo action could not be completed. Try again." };
  if (notice === "invalid") return { role: "alert" as const, text: "Check the required fields and description length." };
  if (notice) return { role: "alert" as const, text: "The action could not be saved. Check the tool state and try again." };
  return null;
}

export default async function DamagePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  const { data: member, error: memberError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (memberError) throw new Error("Workspace membership could not be checked.");
  if (!member) redirect("/app/onboarding");

  const [toolResult, reportResult, workerResult] = await Promise.all([
    supabase.from("tools").select("id,name,asset_code,status").eq("company_id", member.company_id).neq("status", "retired").order("name").limit(500),
    supabase.from("damage_reports").select("id,tool_id,reported_by_worker_id,reported_by_user_id,severity,description,status,created_at,resolved_at").eq("company_id", member.company_id).order("created_at", { ascending: false }).limit(100),
    supabase.from("workers").select("id,name").eq("company_id", member.company_id).order("name").limit(500),
  ]);
  if (toolResult.error || reportResult.error || workerResult.error) throw new Error("Damage records could not be loaded.");

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

  const toolNames = new Map(tools.map((tool) => [tool.id, `${tool.name} · ${tool.asset_code}`]));
  const workerNames = new Map((workerResult.data ?? []).map((worker) => [worker.id, worker.name]));
  const notice = noticeMessage((await searchParams).notice);

  return <main className="service-page">
    <header><Link href="/app">← Workspace</Link><p className="service-eyebrow">TOOL EXCEPTIONS</p><h1>Damage reports</h1><p>{filesEnabled ? "Record a damaged or missing tool, add private photo evidence, and keep its resolution with the tool history." : "Record a damaged or missing tool and its resolution. Photos are not enabled yet; do not include sensitive personal information in descriptions."}</p></header>
    {notice && <p className="service-notice" role={notice.role}>{notice.text}</p>}
    <div className="service-grid">
      <section className="service-card"><h2>Report an issue</h2><form action={reportDamage}><label htmlFor="damage-tool">Tool</label><select id="damage-tool" name="toolId" required defaultValue=""><option value="" disabled>Select a tool</option>{tools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name} · {tool.asset_code} ({tool.status})</option>)}</select><label htmlFor="damage-severity">Severity</label><select id="damage-severity" name="severity" required defaultValue="minor"><option value="minor">Minor</option><option value="needs_repair">Needs repair</option><option value="unusable">Unusable</option><option value="lost">Missing / lost</option></select><label htmlFor="damage-description">What happened?</label><textarea id="damage-description" name="description" required minLength={3} maxLength={1000} rows={4} /><button type="submit" disabled={!tools.length}>Save report</button></form></section>
      <section className="service-card"><h2>Recent reports</h2>{reports.length ? <ul className="service-list">{reports.map((report) => <li key={report.id}><strong>{toolNames.get(report.tool_id) ?? "Tool record"}</strong><small>{report.severity.replaceAll("_", " ")} · {report.status} · {report.created_at.slice(0, 10)} · {report.reported_by_worker_id ? `Field worker: ${workerNames.get(report.reported_by_worker_id) ?? "Worker"}` : "Manager report"}</small><p>{report.description}</p>{filesEnabled && <CustomerFilesSection compact kind="damage_photo" subjectId={report.id} files={filesByReport.get(report.id) ?? []} />}{report.status === "open" && <form action={resolveDamage}><input type="hidden" name="reportId" value={report.id} /><label htmlFor={`resolution-${report.id}`}>Resolution</label><textarea id={`resolution-${report.id}`} name="resolution" required minLength={3} maxLength={1000} rows={2} /><button type="submit">Resolve report</button></form>}</li>)}</ul> : <p>No damage has been reported.</p>}</section>
    </div>
  </main>;
}
