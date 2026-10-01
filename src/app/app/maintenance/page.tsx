import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerFilesSection, type CustomerFileView } from "../../../components/customer-files";
import { customerFilesEnabled } from "../../../lib/files/customer-files";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { createWorkOrder, recordService, scheduleService, setWorkOrderStatus } from "./actions";
import "../service.css";

export const metadata: Metadata = { title: "Maintenance | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function noticeMessage(notice?: string) {
  if (notice === "scheduled") return { role: "status" as const, text: "Service schedule saved." };
  if (notice === "recorded") return { role: "status" as const, text: "Service event saved and the next due date updated." };
  if (notice === "work-order-created") return { role: "status" as const, text: "Work order created." };
  if (notice === "work-order-updated") return { role: "status" as const, text: "Work order status updated." };
  if (notice === "work-order-invalid") return { role: "alert" as const, text: "Check the work order fields." };
  if (notice === "work-order-unavailable") return { role: "alert" as const, text: "The work order could not be saved." };
  if (notice === "file-uploaded") return { role: "status" as const, text: "Maintenance attachment uploaded." };
  if (notice === "file-deleted") return { role: "status" as const, text: "Maintenance attachment deleted." };
  if (notice === "file-quota") return { role: "alert" as const, text: "Storage allowance reached. Delete files or review the workspace plan." };
  if (notice === "file-invalid-size") return { role: "alert" as const, text: "Files must be between 1 byte and 10 MB." };
  if (notice === "file-invalid-type") return { role: "alert" as const, text: "Maintenance attachments must be JPEG, PNG, WebP, or PDF." };
  if (notice?.startsWith("file-")) return { role: "alert" as const, text: "The attachment action could not be completed. Try again." };
  if (notice === "invalid") return { role: "alert" as const, text: "Check the service, date, interval and cost fields." };
  if (notice) return { role: "alert" as const, text: "The action could not be saved. Check for a duplicate schedule or changed tool state." };
  return null;
}

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

  const [toolResult, scheduleResult, eventResult, workOrderResult] = await Promise.all([
    supabase.from("tools").select("id,name,asset_code,status").eq("company_id", member.company_id).neq("status", "retired").order("name").limit(500),
    supabase.from("maintenance_schedules").select("id,tool_id,service_name,interval_days,next_due_at,active").eq("company_id", member.company_id).eq("active", true).order("next_due_at").limit(100),
    supabase.from("maintenance_events").select("id,tool_id,service_name,notes,cost_cents,serviced_at").eq("company_id", member.company_id).order("serviced_at", { ascending: false }).limit(50),
    supabase.from("work_orders").select("id,tool_id,title,status,notes,due_date,created_at,completed_at").eq("company_id", member.company_id).order("created_at", { ascending: false }).limit(100),
  ]);
  if (toolResult.error || scheduleResult.error || eventResult.error || workOrderResult.error) throw new Error("Maintenance records could not be loaded.");

  const tools = toolResult.data ?? [];
  const schedules = scheduleResult.data ?? [];
  const events = eventResult.data ?? [];
  const workOrders = workOrderResult.data ?? [];
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

  const toolNames = new Map(tools.map((tool) => [tool.id, `${tool.name} · ${tool.asset_code}`]));
  const notice = noticeMessage((await searchParams).notice);
  const today = new Date().toISOString().slice(0, 10);

  return <main className="service-page">
    <header><Link href="/app">← Workspace</Link><p className="service-eyebrow">SERVICE HISTORY</p><h1>Maintenance</h1><p>{filesEnabled ? "Schedule recurring service, record completed work, and keep private service photos or PDFs with each completed event." : "Schedule recurring service and record completed work. Dates and costs are entered by your team; reminders, attachments and automatic inspections are not enabled yet."}</p></header>
    {notice && <p className="service-notice" role={notice.role}>{notice.text}</p>}
    <div className="service-grid">
      <section className="service-card"><h2>Add a service schedule</h2><form action={scheduleService}><label htmlFor="service-tool">Tool</label><select id="service-tool" name="toolId" required defaultValue=""><option value="" disabled>Select a tool</option>{tools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name} · {tool.asset_code}</option>)}</select><label htmlFor="service-name">Service</label><input id="service-name" name="serviceName" required minLength={2} maxLength={120} placeholder="Inspection or calibration" /><label htmlFor="service-interval">Repeat every (days)</label><input id="service-interval" name="intervalDays" type="number" required min={1} max={3650} defaultValue={90} /><label htmlFor="service-due">Next due</label><input id="service-due" name="nextDueAt" type="date" required /><button type="submit" disabled={!tools.length}>Save schedule</button></form></section>
      <section className="service-card"><h2>Upcoming service</h2>{schedules.length ? <ul className="service-list">{schedules.map((schedule) => <li key={schedule.id}><strong>{toolNames.get(schedule.tool_id) ?? "Tool record"}</strong><small>{schedule.service_name} · due {schedule.next_due_at} · every {schedule.interval_days} days</small><form action={recordService}><input type="hidden" name="scheduleId" value={schedule.id} /><label htmlFor={`done-${schedule.id}`}>Service completed on</label><input id={`done-${schedule.id}`} name="servicedAt" type="date" required max={today} defaultValue={today} /><label htmlFor={`cost-${schedule.id}`}>Cost (USD)</label><input id={`cost-${schedule.id}`} name="cost" inputMode="decimal" required pattern="[0-9]{1,7}(\\.[0-9]{1,2})?" defaultValue="0.00" /><label htmlFor={`notes-${schedule.id}`}>Notes (optional)</label><textarea id={`notes-${schedule.id}`} name="notes" maxLength={1000} rows={2} /><button type="submit">Record service</button></form></li>)}</ul> : <p>No service schedules yet.</p>}</section>
    </div>
    <section className="service-card"><h2>Work orders</h2><p>Keep repair follow-up lightweight: open, in progress, completed, or cancelled.</p><form action={createWorkOrder}><label htmlFor="work-order-tool">Tool</label><select id="work-order-tool" name="toolId" required defaultValue=""><option value="" disabled>Select a tool</option>{tools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name} · {tool.asset_code}</option>)}</select><label htmlFor="work-order-title">Work</label><input id="work-order-title" name="title" required minLength={2} maxLength={160} placeholder="Repair guard or inspect chuck" /><label htmlFor="work-order-due">Due date (optional)</label><input id="work-order-due" name="dueDate" type="date" /><label htmlFor="work-order-notes">Notes (optional)</label><textarea id="work-order-notes" name="notes" maxLength={1000} rows={2} /><button type="submit" disabled={!tools.length}>Create work order</button></form>{workOrders.length ? <ul className="service-list">{workOrders.map((order) => <li key={order.id}><strong>{toolNames.get(order.tool_id) ?? "Tool record"} · {order.title}</strong><small>{order.status.replaceAll("_", " ")}{order.due_date ? ` · due ${order.due_date}` : ""}</small>{order.notes && <p>{order.notes}</p>}<form action={setWorkOrderStatus}><input type="hidden" name="workOrderId" value={order.id} /><label htmlFor={`work-order-status-${order.id}`}>Status</label><select id={`work-order-status-${order.id}`} name="status" defaultValue={order.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><button type="submit">Update</button></form></li>)}</ul> : <p>No work orders yet.</p>}</section>

    <section className="service-card"><h2>Recent service history</h2>{events.length ? <ul className="service-list">{events.map((event) => <li key={event.id}><strong>{toolNames.get(event.tool_id) ?? "Tool record"}</strong><small>{event.service_name} · {event.serviced_at} · ${(event.cost_cents / 100).toFixed(2)}</small>{event.notes && <p>{event.notes}</p>}{filesEnabled && <CustomerFilesSection compact kind="maintenance_attachment" subjectId={event.id} files={filesByEvent.get(event.id) ?? []} />}</li>)}</ul> : <p>No completed service recorded.</p>}</section>
  </main>;
}
