import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { reportDamage, resolveDamage } from "./actions";
import "../service.css";

export const metadata: Metadata = { title: "Damage reports | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

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
  const [toolResult, reportResult] = await Promise.all([
    supabase.from("tools").select("id,name,asset_code,status").eq("company_id", member.company_id).neq("status", "retired").order("name").limit(500),
    supabase.from("damage_reports").select("id,tool_id,severity,description,status,created_at,resolved_at").eq("company_id", member.company_id).order("created_at", { ascending: false }).limit(100),
  ]);
  if (toolResult.error || reportResult.error) throw new Error("Damage records could not be loaded.");
  const tools = toolResult.data ?? [];
  const reports = reportResult.data ?? [];
  const toolNames = new Map(tools.map((tool) => [tool.id, `${tool.name} · ${tool.asset_code}`]));
  const notice = (await searchParams).notice;

  return <main className="service-page"><header><Link href="/app">← Workspace</Link><p className="service-eyebrow">TOOL EXCEPTIONS</p><h1>Damage reports</h1><p>Record a damaged or missing tool and its resolution. Photos are not enabled yet; do not include sensitive personal information in descriptions.</p></header>{notice && <p className="service-notice" role={notice === "reported" || notice === "resolved" ? "status" : "alert"}>{notice === "reported" ? "Report recorded and tool status updated." : notice === "resolved" ? "Report resolved and tool history updated." : notice === "invalid" ? "Check the required fields and description length." : "The action could not be saved. Check the tool state and try again."}</p>}<div className="service-grid"><section className="service-card"><h2>Report an issue</h2><form action={reportDamage}><label htmlFor="damage-tool">Tool</label><select id="damage-tool" name="toolId" required defaultValue=""><option value="" disabled>Select a tool</option>{tools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name} · {tool.asset_code} ({tool.status})</option>)}</select><label htmlFor="damage-severity">Severity</label><select id="damage-severity" name="severity" required defaultValue="minor"><option value="minor">Minor</option><option value="needs_repair">Needs repair</option><option value="unusable">Unusable</option><option value="lost">Missing / lost</option></select><label htmlFor="damage-description">What happened?</label><textarea id="damage-description" name="description" required minLength={3} maxLength={1000} rows={4} /><button type="submit" disabled={!tools.length}>Save report</button></form></section><section className="service-card"><h2>Recent reports</h2>{reports.length ? <ul className="service-list">{reports.map((report) => <li key={report.id}><strong>{toolNames.get(report.tool_id) ?? "Tool record"}</strong><small>{report.severity.replaceAll("_", " ")} · {report.status} · {report.created_at.slice(0, 10)}</small><p>{report.description}</p>{report.status === "open" && <form action={resolveDamage}><input type="hidden" name="reportId" value={report.id} /><label htmlFor={`resolution-${report.id}`}>Resolution</label><textarea id={`resolution-${report.id}`} name="resolution" required minLength={3} maxLength={1000} rows={2} /><button type="submit">Resolve report</button></form>}</li>)}</ul> : <p>No damage has been reported.</p>}</section></div></main>;
}
