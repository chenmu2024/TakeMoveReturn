import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { recordToolMovement } from "./actions";
import "./tool-detail.css";

export const metadata: Metadata = { title: "Tool Record | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ToolDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
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
  const [toolResult, workerResult, locationResult, historyResult] = await Promise.all([
    supabase.from("tools").select("id,name,asset_code,category,status,condition,current_worker_id,current_location_id,updated_at")
      .eq("id", id).eq("company_id", membership.company_id).maybeSingle(),
    supabase.from("workers").select("id,name,status").eq("company_id", membership.company_id).order("name"),
    supabase.from("locations").select("id,name,type,active").eq("company_id", membership.company_id).order("name"),
    supabase.from("tool_transactions").select("id,transaction_type,from_worker_id,to_worker_id,to_location_id,notes,created_at")
      .eq("tool_id", id).eq("company_id", membership.company_id).order("created_at", { ascending: false }).limit(30),
  ]);
  if (toolResult.error || workerResult.error || locationResult.error || historyResult.error) throw new Error("Tool record could not be loaded.");
  const tool = toolResult.data;
  if (!tool) notFound();
  const workers = workerResult.data ?? [];
  const locations = locationResult.data ?? [];
  const activeWorkers = workers.filter((worker) => worker.status === "active");
  const activeLocations = locations.filter((location) => location.active);
  const workerName = (workerId: string | null) => workers.find((worker) => worker.id === workerId)?.name ?? "—";
  const locationName = (locationId: string | null) => locations.find((location) => location.id === locationId)?.name ?? "—";
  const notice = (await searchParams).notice;
  const canTake = tool.status === "available" && activeWorkers.length > 0 && activeLocations.length > 0;
  const canMove = ["available", "checked_out"].includes(tool.status) && activeLocations.length > 0;
  const canReturn = tool.status === "checked_out" && activeLocations.length > 0;

  return <main className="tool-detail"><header className="tool-detail-header"><Link href="/app/tools">← Back to tools</Link><span>TAKE · MOVE · RETURN</span></header><section className="tool-detail-hero"><div><p className="tool-detail-eyebrow">TOOL RECORD · {tool.asset_code}</p><h1>{tool.name}</h1><p>{tool.category || "Reusable tool"}</p></div><strong>{tool.status.replaceAll("_", " ")}</strong></section>{notice && <p className="tool-detail-notice" role={notice === "saved" ? "status" : "alert"}>{notice === "saved" ? "Movement saved to the tool history." : notice === "state" ? "The tool changed state before this action was saved. Review its current status and try again." : notice === "invalid" ? "Choose the required worker and location." : "Movement could not be saved. Check the worker and location, then try again."}</p>}<section className="tool-detail-grid"><article className="tool-detail-panel"><p className="tool-detail-eyebrow">CURRENT CUSTODY</p><dl><div><dt>Holder</dt><dd>{workerName(tool.current_worker_id)}</dd></div><div><dt>Location</dt><dd>{locationName(tool.current_location_id)}</dd></div><div><dt>Condition</dt><dd>{tool.condition}</dd></div><div><dt>Last updated</dt><dd>{tool.updated_at.slice(0, 16).replace("T", " ")} UTC</dd></div></dl></article><article className="tool-detail-panel"><p className="tool-detail-eyebrow">MANAGER HANDOFF</p><h2>Record the next move</h2><p>Only an authenticated workspace manager can change custody. A QR label identifies a tool; it does not grant access.</p>{activeLocations.length === 0 && <p>Add an <Link href="/app/locations/new">active location</Link> before recording a movement.</p>}{tool.status === "available" && activeWorkers.length === 0 && <p>Add an <Link href="/app/workers/new">active worker</Link> before TAKE.</p>}{!canTake && !canMove && !canReturn && <p>This tool is not eligible for TAKE, MOVE or RETURN in its current status.</p>}</article></section><section className="tool-detail-actions" aria-label="Tool movement actions">{canTake && <form action={recordToolMovement}><input type="hidden" name="toolId" value={tool.id} /><input type="hidden" name="type" value="checkout" /><h2>TAKE</h2><p>Assign this available tool to a worker.</p><label htmlFor="take-worker">Worker</label><select id="take-worker" name="workerId" required defaultValue=""><option value="" disabled>Select worker</option>{activeWorkers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select><label htmlFor="take-location">Location</label><select id="take-location" name="locationId" required defaultValue=""><option value="" disabled>Select location</option>{activeLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><button type="submit">Record TAKE</button></form>}{canMove && <form action={recordToolMovement}><input type="hidden" name="toolId" value={tool.id} /><input type="hidden" name="type" value="transfer" /><h2>MOVE</h2><p>Set the destination and who holds the tool after the move.</p><label htmlFor="move-location">Destination</label><select id="move-location" name="locationId" required defaultValue=""><option value="" disabled>Select location</option>{activeLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><label htmlFor="move-worker">Holder after move</label><select id="move-worker" name="workerId" defaultValue={tool.current_worker_id && activeWorkers.some((worker) => worker.id === tool.current_worker_id) ? tool.current_worker_id : ""}><option value="">No worker — available at destination</option>{activeWorkers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select><button type="submit">Record MOVE</button></form>}{canReturn && <form action={recordToolMovement}><input type="hidden" name="toolId" value={tool.id} /><input type="hidden" name="type" value="return" /><input type="hidden" name="workerId" value="" /><h2>RETURN</h2><p>Clear the holder and record where the tool was returned.</p><label htmlFor="return-location">Return location</label><select id="return-location" name="locationId" required defaultValue=""><option value="" disabled>Select location</option>{activeLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><button type="submit">Record RETURN</button></form>}</section><section className="tool-detail-panel tool-detail-history"><p className="tool-detail-eyebrow">AUDITABLE HISTORY</p><h2>Recent movements</h2>{historyResult.data?.length ? <ol>{historyResult.data.map((event) => <li key={event.id}><div><strong>{event.transaction_type.toUpperCase()}</strong><time dateTime={event.created_at}>{event.created_at.slice(0, 16).replace("T", " ")} UTC</time></div><p>{workerName(event.from_worker_id)} → {workerName(event.to_worker_id)} · {locationName(event.to_location_id)}</p>{event.notes && <p>{event.notes}</p>}</li>)}</ol> : <p>No movement has been recorded for this tool yet.</p>}</section></main>;
}
