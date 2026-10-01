import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CustomerFilesSection, type CustomerFileView } from "../../../../components/customer-files";
import { customerFilesEnabled } from "../../../../lib/files/customer-files";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { localDueDateFromBoundary } from "../../../../lib/timezone";
import { recordToolMovement, setToolReturnDueDate } from "./actions";
import "./tool-detail.css";

export const metadata: Metadata = { title: "Tool Record | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function noticeMessage(notice?: string) {
  if (notice === "saved") return { role: "status" as const, text: "Movement saved to the tool history." };
  if (notice === "due-saved") return { role: "status" as const, text: "Expected return date updated." };
  if (notice === "due-invalid") return { role: "alert" as const, text: "Choose a valid future return date in the workspace timezone." };
  if (notice === "due-state") return { role: "alert" as const, text: "This tool is no longer checked out. Refresh the record." };
  if (notice === "due-unavailable") return { role: "alert" as const, text: "The return date could not be changed. Try again." };
  if (notice === "state") return { role: "alert" as const, text: "The tool changed state before this action was saved. Review its current status and try again." };
  if (notice === "invalid") return { role: "alert" as const, text: "Choose the required worker and location." };
  if (notice === "file-uploaded") return { role: "status" as const, text: "Tool photo uploaded." };
  if (notice === "file-deleted") return { role: "status" as const, text: "Tool photo deleted." };
  if (notice === "file-quota") return { role: "alert" as const, text: "Storage allowance reached. Delete files or review the workspace plan before uploading another photo." };
  if (notice === "file-invalid-size") return { role: "alert" as const, text: "Tool photos must be between 1 byte and 5 MB." };
  if (notice === "file-invalid-type") return { role: "alert" as const, text: "Tool photos must be JPEG, PNG, or WebP." };
  if (notice === "file-limit") return { role: "alert" as const, text: "A tool can have one active primary photo. Delete the current photo before uploading a replacement." };
  if (notice === "file-invalid-name") return { role: "alert" as const, text: "Choose a file with a simple file name." };
  if (notice?.startsWith("file-")) return { role: "alert" as const, text: "The file action could not be completed. Try again." };
  if (notice) return { role: "alert" as const, text: "Movement could not be saved. Check the worker and location, then try again." };
  return null;
}

export default async function ToolDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string; historyPage?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) throw new Error("Workspace membership could not be checked.");
  if (!membership) redirect("/app/onboarding");

  const query = await searchParams;
  const parsedHistoryPage = Number.parseInt(query.historyPage ?? "1", 10);
  const historyPage = Number.isFinite(parsedHistoryPage) && parsedHistoryPage > 0 ? parsedHistoryPage : 1;
  const historyPageSize = 50;
  const historyFrom = (historyPage - 1) * historyPageSize;
  const historyTo = historyFrom + historyPageSize - 1;

  const [toolResult, workerResult, locationResult, historyResult, companyResult] = await Promise.all([
    supabase.from("tools").select("id,name,asset_code,category,status,condition,current_worker_id,current_location_id,expected_return_at,updated_at")
      .eq("id", id).eq("company_id", membership.company_id).maybeSingle(),
    supabase.from("workers").select("id,name,status").eq("company_id", membership.company_id).order("name"),
    supabase.from("locations").select("id,name,type,active").eq("company_id", membership.company_id).order("name"),
    supabase.from("tool_transactions").select("id,transaction_type,from_worker_id,to_worker_id,to_location_id,notes,created_at")
      .eq("tool_id", id).eq("company_id", membership.company_id).order("created_at", { ascending: false })
      .range(historyFrom, historyTo),
    supabase.from("companies").select("timezone").eq("id", membership.company_id).maybeSingle(),
  ]);
  if (toolResult.error || workerResult.error || locationResult.error || historyResult.error || companyResult.error) throw new Error("Tool record could not be loaded.");

  const tool = toolResult.data;
  if (!tool) notFound();

  let toolFiles: CustomerFileView[] = [];
  const filesEnabled = customerFilesEnabled();
  if (filesEnabled) {
    const { data: fileRows, error: fileError } = await supabase.from("customer_files")
      .select("id,original_name,content_type,size_bytes")
      .eq("tool_id", id).eq("kind", "tool_photo").eq("status", "ready")
      .order("created_at", { ascending: false }).limit(1);
    if (fileError) throw new Error("Tool photos could not be loaded.");
    toolFiles = (fileRows ?? []).map((file) => ({ ...file, size_bytes: Number(file.size_bytes) }));
  }

  const companyTimezone = companyResult.data?.timezone || "UTC";
  const dueDate = localDueDateFromBoundary(tool.expected_return_at, companyTimezone);
  const workers = workerResult.data ?? [];
  const locations = locationResult.data ?? [];
  const activeWorkers = workers.filter((worker) => worker.status === "active");
  const activeLocations = locations.filter((location) => location.active);
  const workerName = (workerId: string | null) => workers.find((worker) => worker.id === workerId)?.name ?? "—";
  const locationName = (locationId: string | null) => locations.find((location) => location.id === locationId)?.name ?? "—";
  const notice = noticeMessage(query.notice);
  const canTake = tool.status === "available" && activeWorkers.length > 0 && activeLocations.length > 0;
  const canMove = ["available", "checked_out"].includes(tool.status) && activeLocations.length > 0;
  const canReturn = tool.status === "checked_out" && activeLocations.length > 0;

  return <main className="tool-detail">
    <header className="tool-detail-header"><Link href="/app/tools">← Back to tools</Link><span>TAKE · MOVE · RETURN</span></header>
    <section className="tool-detail-hero"><div><p className="tool-detail-eyebrow">TOOL RECORD · {tool.asset_code}</p><h1>{tool.name}</h1><p>{tool.category || "Reusable tool"}</p></div><strong>{tool.status.replaceAll("_", " ")}</strong></section>
    {notice && <p className="tool-detail-notice" role={notice.role}>{notice.text}</p>}

    <section className="tool-detail-grid">
      <article className="tool-detail-panel"><p className="tool-detail-eyebrow">CURRENT CUSTODY</p><dl><div><dt>Holder</dt><dd>{workerName(tool.current_worker_id)}</dd></div><div><dt>Location</dt><dd>{locationName(tool.current_location_id)}</dd></div><div><dt>Condition</dt><dd>{tool.condition}</dd></div>{tool.status === "checked_out" && <div><dt>Expected return</dt><dd>{tool.expected_return_at ? <><time dateTime={tool.expected_return_at}>{dueDate ?? "Invalid date"}</time>{Date.parse(tool.expected_return_at) <= Date.now() ? " · Overdue" : ""}</> : "Not set"}</dd></div>}<div><dt>Last updated</dt><dd>{tool.updated_at.slice(0, 16).replace("T", " ")} UTC</dd></div></dl></article>
      <article className="tool-detail-panel"><p className="tool-detail-eyebrow">MANAGER HANDOFF</p><h2>Record the next move</h2><p>Only an authenticated workspace manager can change custody. A QR label identifies a tool; it does not grant access.</p>{activeLocations.length === 0 && <p>Add an <Link href="/app/locations/new">active location</Link> before recording a movement.</p>}{tool.status === "available" && activeWorkers.length === 0 && <p>Add an <Link href="/app/workers/new">active worker</Link> before TAKE.</p>}{!canTake && !canMove && !canReturn && <p>This tool is not eligible for TAKE, MOVE or RETURN in its current status.</p>}</article>
    </section>

    {tool.status === "checked_out" && <section className="tool-detail-panel tool-detail-due"><p className="tool-detail-eyebrow">RETURN FOLLOW-UP</p><h2>Expected return</h2><p>Set an optional due date to highlight overdue tools in the workspace. This is an in-app reminder; no email or SMS is sent.</p><form action={setToolReturnDueDate}><input type="hidden" name="toolId" value={tool.id} /><label htmlFor="return-due-date">Return date ({companyTimezone})</label><input id="return-due-date" name="dueDate" type="date" defaultValue={dueDate ?? ""} /><button type="submit">Save return date</button></form></section>}

    {filesEnabled && <section className="tool-detail-panel"><p className="tool-detail-eyebrow">TOOL PHOTOS</p><h2>Reference photos</h2><p>Photos are private to authenticated workspace members and count against the workspace storage allowance.</p><CustomerFilesSection kind="tool_photo" subjectId={tool.id} files={toolFiles} /></section>}

    <section className="tool-detail-actions" aria-label="Tool movement actions">
      {canTake && <form action={recordToolMovement}><input type="hidden" name="toolId" value={tool.id} /><input type="hidden" name="type" value="checkout" /><h2>TAKE</h2><p>Assign this available tool to a worker.</p><label htmlFor="take-worker">Worker</label><select id="take-worker" name="workerId" required defaultValue=""><option value="" disabled>Select worker</option>{activeWorkers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select><label htmlFor="take-location">Location</label><select id="take-location" name="locationId" required defaultValue=""><option value="" disabled>Select location</option>{activeLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><button type="submit">Record TAKE</button></form>}
      {canMove && <form action={recordToolMovement}><input type="hidden" name="toolId" value={tool.id} /><input type="hidden" name="type" value="transfer" /><h2>MOVE</h2><p>Set the destination and who holds the tool after the move.</p><label htmlFor="move-location">Destination</label><select id="move-location" name="locationId" required defaultValue=""><option value="" disabled>Select location</option>{activeLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><label htmlFor="move-worker">Holder after move</label><select id="move-worker" name="workerId" defaultValue={tool.current_worker_id && activeWorkers.some((worker) => worker.id === tool.current_worker_id) ? tool.current_worker_id : ""}><option value="">No worker — available at destination</option>{activeWorkers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select><button type="submit">Record MOVE</button></form>}
      {canReturn && <form action={recordToolMovement}><input type="hidden" name="toolId" value={tool.id} /><input type="hidden" name="type" value="return" /><input type="hidden" name="workerId" value="" /><h2>RETURN</h2><p>Clear the holder and record where the tool was returned.</p><label htmlFor="return-location">Return location</label><select id="return-location" name="locationId" required defaultValue=""><option value="" disabled>Select location</option>{activeLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><button type="submit">Record RETURN</button></form>}
    </section>

    <section className="tool-detail-panel tool-detail-history"><p className="tool-detail-eyebrow">AUDITABLE HISTORY</p><h2>Complete movement history</h2>{historyResult.data?.length ? <><ol>{historyResult.data.map((event) => <li key={event.id}><div><strong>{event.transaction_type.toUpperCase()}</strong><time dateTime={event.created_at}>{event.created_at.slice(0, 16).replace("T", " ")} UTC</time></div><p>{workerName(event.from_worker_id)} → {workerName(event.to_worker_id)} · {locationName(event.to_location_id)}</p>{event.notes && <p>{event.notes}</p>}</li>)}</ol><nav aria-label="Movement history pages">{historyPage > 1 && <Link href={`/app/tools/${tool.id}?historyPage=${historyPage - 1}`}>← Newer</Link>}{historyResult.data.length === historyPageSize && <Link href={`/app/tools/${tool.id}?historyPage=${historyPage + 1}`}>Older →</Link>}</nav></> : <p>{historyPage > 1 ? "No older movement records." : "No movement has been recorded for this tool yet."}</p>}</section>
  </main>;
}
