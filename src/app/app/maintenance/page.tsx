import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerFilesSection, type CustomerFileView } from "../../../components/customer-files";
import { ServicePages, servicePage, type ServiceParams } from "../../../components/service-pages";
import { customerFilesEnabled } from "../../../lib/files/customer-files";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { recordService, scheduleService } from "./actions";
import "../service.css";

export const metadata: Metadata = { title: "Maintenance | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function noticeMessage(notice?: string) {
  if (notice === "scheduled") return { role: "status" as const, text: "Service schedule saved." };
  if (notice === "recorded") return { role: "status" as const, text: "Service event saved and the next due date updated." };
  if (notice === "file-uploaded") return { role: "status" as const, text: "Maintenance attachment uploaded." };
  if (notice === "file-deleted") return { role: "status" as const, text: "Maintenance attachment deleted." };
  if (notice === "file-quota") return { role: "alert" as const, text: "Storage allowance reached. Delete files or review the workspace plan." };
  if (notice === "file-invalid-size") return { role: "alert" as const, text: "Files must be between 1 byte and 10 MB." };
  if (notice === "file-invalid-type") return { role: "alert" as const, text: "Maintenance attachments must be JPEG, PNG, WebP, or PDF." };
  if (notice === "file-limit") return { role: "alert" as const, text: "A maintenance event can have up to three attachments. Delete one before uploading another." };
  if (notice?.startsWith("file-")) return { role: "alert" as const, text: "The attachment action could not be completed. Try again." };
  if (notice === "invalid") return { role: "alert" as const, text: "Check the service, date, interval and cost fields." };
  if (notice) return { role: "alert" as const, text: "The action could not be saved. Check for a duplicate schedule or changed tool state." };
  return null;
}

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<ServiceParams> }) {
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
  const [toolResult, scheduleResult, eventResult] = await Promise.all([
    selectableTools.order("name").order("id").range((toolPage - 1) * 50, toolPage * 50 - 1),
    supabase.from("maintenance_schedules").select("id,tool_id,service_name,interval_days,next_due_at,active", { count: "exact" }).eq("company_id", member.company_id).eq("active", true).order("next_due_at").order("id").range((schedulePage - 1) * 50, schedulePage * 50 - 1),
    supabase.from("maintenance_events").select("id,tool_id,service_name,notes,cost_cents,serviced_at", { count: "exact" }).eq("company_id", member.company_id).order("serviced_at", { ascending: false }).order("id").range((page - 1) * 50, page * 50 - 1),
  ]);
  if (toolResult.error || scheduleResult.error || eventResult.error) throw new Error("Maintenance records could not be loaded.");

  const tools = toolResult.data ?? [];
  const schedules = scheduleResult.data ?? [];
  const events = eventResult.data ?? [];
  const filesEnabled = customerFilesEnabled();
  const filesByEvent = new Map<string, CustomerFileView[]>();

  if (filesEnabled && events.length) {
    const { data: fileRows, error: fileError } = await supabase.from("customer_files")
      .select("id,maintenance_event_id,original_name,content_type,size_bytes")
      .eq("kind", "maintenance_attachment").eq("status", "ready")
      .in("maintenance_event_id", events.map((event) => event.id))
      .order("created_at", { ascending: false });
    if (fileError) throw new Error("Maintenance attachments could not be loaded.");
    for (const file of fileRows ?? []) {
      if (!file.maintenance_event_id) continue;
      const list = filesByEvent.get(file.maintenance_event_id) ?? [];
      list.push({ id: file.id, original_name: file.original_name, content_type: file.content_type, size_bytes: Number(file.size_bytes) });
      filesByEvent.set(file.maintenance_event_id, list);
    }
  }

  if (toolPage > Math.max(1, Math.ceil((toolResult.count ?? 0) / 50)) || page > Math.max(1, Math.ceil((eventResult.count ?? 0) / 50)) || schedulePage > Math.max(1, Math.ceil((scheduleResult.count ?? 0) / 50))) notFound();
  const recordToolIds = [...new Set([...schedules, ...events].map((record) => record.tool_id))];
  const recordTools = recordToolIds.length ? await supabase.from("tools").select("id,name,asset_code").eq("company_id", member.company_id).in("id", recordToolIds) : { data: [], error: null };
  if (recordTools.error) throw new Error("Record tools could not be loaded.");
  const toolNames = new Map((recordTools.data ?? []).map((tool) => [tool.id, `${tool.name} · ${tool.asset_code}`]));
  const notice = noticeMessage(params.notice);
  const today = new Date().toISOString().slice(0, 10);

  return <main className="service-page">
    <header><Link href="/app">← Workspace</Link><p className="service-eyebrow">SERVICE HISTORY</p><h1>Maintenance</h1><p>{filesEnabled ? "Schedule recurring service, record completed work, and keep private service photos or PDFs with each completed event." : "Schedule recurring service and record completed work. Dates and costs are entered by your team; reminders, attachments and automatic inspections are not enabled yet."}</p></header>
    {notice && <p className="service-notice" role={notice.role}>{notice.text}</p>}
    <section className="service-card"><h2>Find a tool</h2><form method="get"><label htmlFor="tool-search">Search tool names</label><input id="tool-search" name="toolQuery" defaultValue={toolQuery} maxLength={100} /><button type="submit">Search tools</button></form><ServicePages params={params} parameter="toolPage" page={toolPage} count={toolResult.count ?? 0} label="Tool selection pages" /></section>
    <div className="service-grid">
      <section className="service-card"><h2>Add a service schedule</h2><form action={scheduleService}><label htmlFor="service-tool">Tool</label><select id="service-tool" name="toolId" required defaultValue=""><option value="" disabled>Select a tool</option>{tools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name} · {tool.asset_code}</option>)}</select><label htmlFor="service-name">Service</label><input id="service-name" name="serviceName" required minLength={2} maxLength={120} placeholder="Inspection or calibration" /><label htmlFor="service-interval">Repeat every (days)</label><input id="service-interval" name="intervalDays" type="number" required min={1} max={3650} defaultValue={90} /><label htmlFor="service-due">Next due</label><input id="service-due" name="nextDueAt" type="date" required /><button type="submit" disabled={!tools.length}>Save schedule</button></form></section>
      <section className="service-card"><h2>Upcoming service</h2>{schedules.length ? <ul className="service-list">{schedules.map((schedule) => <li key={schedule.id}><strong>{toolNames.get(schedule.tool_id) ?? "Tool record"}</strong><small>{schedule.service_name} · due {schedule.next_due_at} · every {schedule.interval_days} days</small><form action={recordService}><input type="hidden" name="scheduleId" value={schedule.id} /><label htmlFor={`done-${schedule.id}`}>Service completed on</label><input id={`done-${schedule.id}`} name="servicedAt" type="date" required max={today} defaultValue={today} /><label htmlFor={`cost-${schedule.id}`}>Cost (USD)</label><input id={`cost-${schedule.id}`} name="cost" inputMode="decimal" required pattern="[0-9]{1,7}([.][0-9]{1,2})?" defaultValue="0.00" /><label htmlFor={`notes-${schedule.id}`}>Notes (optional)</label><textarea id={`notes-${schedule.id}`} name="notes" maxLength={1000} rows={2} /><button type="submit">Record service</button></form></li>)}</ul> : <p>No service schedules yet.</p>}<ServicePages params={params} parameter="schedulePage" page={schedulePage} count={scheduleResult.count ?? 0} label="Service schedule pages" /></section>
    </div>
    <section className="service-card"><h2>Recent service history</h2>{events.length ? <ul className="service-list">{events.map((event) => <li key={event.id}><strong>{toolNames.get(event.tool_id) ?? "Tool record"}</strong><small>{event.service_name} · {event.serviced_at} · ${(event.cost_cents / 100).toFixed(2)}</small>{event.notes && <p>{event.notes}</p>}{filesEnabled && <CustomerFilesSection compact kind="maintenance_attachment" subjectId={event.id} files={filesByEvent.get(event.id) ?? []} />}</li>)}</ul> : <p>No completed service recorded.</p>}<ServicePages params={params} parameter="page" page={page} count={eventResult.count ?? 0} label="Service history pages" /></section>
  </main>;
}
