import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { fieldDb, fieldDevice, fieldWorker } from "../../../lib/field/server";
import { recordFieldMovement } from "../../field/actions";
import "./scan.css";

export const metadata: Metadata = { title: "Scan a tool | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ScanPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token) || !isSupabaseConfigured()) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_tool_qr", { p_token: token }).maybeSingle();
  if (error) throw new Error("The tool label could not be checked.");
  if (!data) notFound();
  const tool = data as { company_name: string; tool_name: string; asset_code: string };
  const fieldSession = await fieldWorker();
  const enrolledDevice = fieldSession ? null : await fieldDevice();
  let fieldTool: { status: string; current_worker_id: string | null; current_location_id: string | null } | null = null;
  let fieldLocations: { id: string; name: string }[] = [];
  let currentHolder: string | null = null;
  let currentLocation: string | null = null;
  if (fieldSession) {
    const db = fieldDb();
    const { data: ownTool } = await db.from("tools").select("status,current_worker_id,current_location_id")
      .eq("qr_token", token).eq("company_id", fieldSession.device.company_id).maybeSingle();
    fieldTool = ownTool;
    if (ownTool) {
      const { data: locations } = await db.from("locations").select("id,name,active")
        .eq("company_id", fieldSession.device.company_id).order("name");
      fieldLocations = (locations ?? []).filter((location) => location.active);
      currentLocation = locations?.find((location) => location.id === ownTool.current_location_id)?.name ?? null;
      if (ownTool.current_worker_id) {
        const { data: holder } = await db.from("workers").select("name")
          .eq("id", ownTool.current_worker_id).eq("company_id", fieldSession.device.company_id).maybeSingle();
        currentHolder = holder?.name ?? null;
      }
    }
  }

  const { data: auth } = await supabase.auth.getClaims();
  let toolId: string | null = null;
  if (auth?.claims) {
    const { data: ownTool, error: toolError } = await supabase.from("tools")
      .select("id,company_id").eq("qr_token", token).maybeSingle();
    if (toolError) throw new Error("Workspace tool could not be checked.");
    if (ownTool) {
      const { data: membership, error: membershipError } = await supabase.from("organization_members")
        .select("company_id").eq("user_id", auth.claims.sub).eq("company_id", ownTool.company_id)
        .eq("status", "active").in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
      if (membershipError) throw new Error("Workspace access could not be checked.");
      toolId = membership ? ownTool.id : null;
    }
  }

  const notice = (await searchParams).notice;
  const savedMessage = notice === "checkout-saved" ? "TAKE saved." : notice === "transfer-saved" ? "MOVE saved."
    : notice === "return-saved" ? "RETURN saved." : notice === "saved" ? "Movement saved." : null;
  const moveLocations = fieldLocations.filter((location) => fieldTool?.current_worker_id !== fieldSession?.worker.id
    || location.id !== fieldTool?.current_location_id);
  const actions = fieldTool?.status === "available" ? ["checkout"]
    : fieldTool?.status === "checked_out" ? [...(moveLocations.length ? ["transfer"] : []),
      ...(fieldTool.current_worker_id === fieldSession?.worker.id ? ["return"] : [])] : [];
  return <main className="scan-page"><section className="scan-card">
    <p className="workspace-eyebrow">TAKEMOVERETURN · TOOL LABEL</p><h1>{tool.tool_name}</h1>
    <dl><div><dt>Company</dt><dd>{tool.company_name}</dd></div><div><dt>Asset code</dt><dd>{tool.asset_code}</dd></div></dl>
    <p>A QR label identifies a tool. It does not grant access to custody or history.</p>
    {notice && <p id="movement-status" role={savedMessage ? "status" : "alert"}>{savedMessage ?? (notice === "session" ? "Worker session expired. Sign in again." : "Tool state changed or the movement could not be saved.")}</p>}
    {fieldSession && fieldTool ? <>
      <p>Signed in as {fieldSession.worker.name}. <Link href="/field">Lock or switch</Link></p>
      <p>Current status: {fieldTool.status.replaceAll("_", " ")}</p>
      <dl><div><dt>Current holder</dt><dd>{currentHolder ?? "Unassigned"}</dd></div>
        <div><dt>Current location</dt><dd>{currentLocation ?? "Not set"}</dd></div></dl>
      {fieldLocations.length ? actions.map((type) => {
        const destinations = type === "transfer" ? moveLocations : fieldLocations;
        return <form className="auth-form" action={recordFieldMovement} key={type}>
          <input type="hidden" name="token" value={token} /><input type="hidden" name="type" value={type} />
          <label htmlFor={`location-${type}`}>{type === "return" ? "Return location" : "Destination"}</label>
          <select id={`location-${type}`} name="locationId" required defaultValue=""><option value="" disabled>Choose location</option>
            {destinations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
          <label htmlFor={`notes-${type}`}>Note (optional)</label><input id={`notes-${type}`} name="notes" maxLength={500} />
          <button className="workspace-button" type="submit">{type === "checkout" ? "TAKE" : type === "transfer" ? "MOVE" : "RETURN"}</button>
        </form>;
      }) : <p>Ask a manager to add an active location before moving this tool.</p>}
      {fieldLocations.length > 0 && actions.length === 0 && <p>No field movement is available for this tool.</p>}
    </> : enrolledDevice ? <Link className="workspace-button" href="/field">Worker sign-in</Link>
      : toolId ? <Link className="workspace-button" href={`/app/tools/${toolId}`}>Open tool record</Link>
        : <Link className="workspace-button" href="/field">Field access</Link>}
  </section></main>;
}
