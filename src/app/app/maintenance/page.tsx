import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { recordService, scheduleService } from "./actions";
import "../service.css";

export const metadata: Metadata = { title: "Maintenance | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: member, error: memberError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (memberError) throw new Error("Workspace membership could not be checked.");
  if (!member) redirect("/app/onboarding");
  const [toolResult, scheduleResult, eventResult] = await Promise.all([
    supabase.from("tools").select("id,name,asset_code,status").eq("company_id", member.company_id).neq("status", "retired").order("name").limit(500),
    supabase.from("maintenance_schedules").select("id,tool_id,service_name,interval_days,next_due_at,active").eq("company_id", member.company_id).eq("active", true).order("next_due_at").limit(100),
    supabase.from("maintenance_events").select("id,tool_id,service_name,notes,cost_cents,serviced_at").eq("company_id", member.company_id).order("serviced_at", { ascending: false }).limit(50),
  ]);
  if (toolResult.error || scheduleResult.error || eventResult.error) throw new Error("Maintenance records could not be loaded.");
  const tools = toolResult.data ?? [];
  const schedules = scheduleResult.data ?? [];
  const events = eventResult.data ?? [];
  const toolNames = new Map(tools.map((tool) => [tool.id, `${tool.name} · ${tool.asset_code}`]));
  const notice = (await searchParams).notice;
  const today = new Date().toISOString().slice(0, 10);

  return <main className="service-page"><header><Link href="/app">← Workspace</Link><p className="service-eyebrow">SERVICE HISTORY</p><h1>Maintenance</h1><p>Schedule recurring service and record completed work. Dates and costs are entered by your team; reminders, attachments and automatic inspections are not enabled yet.</p></header>{notice && <p className="service-notice" role={notice === "scheduled" || notice === "recorded" ? "status" : "alert"}>{notice === "scheduled" ? "Service schedule saved." : notice === "recorded" ? "Service event saved and the next due date updated." : notice === "invalid" ? "Check the service, date, interval and cost fields." : "The action could not be saved. Check for a duplicate schedule or changed tool state."}</p>}<div className="service-grid"><section className="service-card"><h2>Add a service schedule</h2><form action={scheduleService}><label htmlFor="service-tool">Tool</label><select id="service-tool" name="toolId" required defaultValue=""><option value="" disabled>Select a tool</option>{tools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name} · {tool.asset_code}</option>)}</select><label htmlFor="service-name">Service</label><input id="service-name" name="serviceName" required minLength={2} maxLength={120} placeholder="Inspection or calibration" /><label htmlFor="service-interval">Repeat every (days)</label><input id="service-interval" name="intervalDays" type="number" required min={1} max={3650} defaultValue={90} /><label htmlFor="service-due">Next due</label><input id="service-due" name="nextDueAt" type="date" required /><button type="submit" disabled={!tools.length}>Save schedule</button></form></section><section className="service-card"><h2>Upcoming service</h2>{schedules.length ? <ul className="service-list">{schedules.map((schedule) => <li key={schedule.id}><strong>{toolNames.get(schedule.tool_id) ?? "Tool record"}</strong><small>{schedule.service_name} · due {schedule.next_due_at} · every {schedule.interval_days} days</small><form action={recordService}><input type="hidden" name="scheduleId" value={schedule.id} /><label htmlFor={`done-${schedule.id}`}>Service completed on</label><input id={`done-${schedule.id}`} name="servicedAt" type="date" required max={today} defaultValue={today} /><label htmlFor={`cost-${schedule.id}`}>Cost (USD)</label><input id={`cost-${schedule.id}`} name="cost" inputMode="decimal" required pattern="[0-9]{1,7}(\.[0-9]{1,2})?" defaultValue="0.00" /><label htmlFor={`notes-${schedule.id}`}>Notes (optional)</label><textarea id={`notes-${schedule.id}`} name="notes" maxLength={1000} rows={2} /><button type="submit">Record service</button></form></li>)}</ul> : <p>No service schedules yet.</p>}</section></div><section className="service-card"><h2>Recent service history</h2>{events.length ? <ul className="service-list">{events.map((event) => <li key={event.id}><strong>{toolNames.get(event.tool_id) ?? "Tool record"}</strong><small>{event.service_name} · {event.serviced_at} · ${(event.cost_cents / 100).toFixed(2)}</small>{event.notes && <p>{event.notes}</p>}</li>)}</ul> : <p>No completed service recorded.</p>}</section></main>;
}
