import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { returnAllWorkerTools } from "./actions";
import "../../service.css";

export const metadata: Metadata = { title: "Worker | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function WorkerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
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
  const { data: worker, error: workerError } = await supabase.from("workers")
    .select("id,name,employee_code,status").eq("id", id).eq("company_id", membership.company_id).maybeSingle();
  if (workerError) throw new Error("Worker could not be loaded.");
  if (!worker) notFound();
  const [countResult, eligibleResult, toolsResult, activityResult, locationsResult] = await Promise.all([
    supabase.from("tools").select("id", { count: "exact", head: true })
      .eq("company_id", membership.company_id).eq("current_worker_id", worker.id),
    supabase.from("tools").select("id", { count: "exact", head: true })
      .eq("company_id", membership.company_id).eq("current_worker_id", worker.id).eq("status", "checked_out"),
    supabase.from("tools").select("id,name,asset_code,status")
      .eq("company_id", membership.company_id).eq("current_worker_id", worker.id)
      .order("name").limit(25),
    supabase.from("tool_transactions").select("id,tool_id,transaction_type,created_at")
      .eq("company_id", membership.company_id)
      .or(`from_worker_id.eq.${worker.id},to_worker_id.eq.${worker.id},performed_by_worker_id.eq.${worker.id}`)
      .order("created_at", { ascending: false }).limit(10),
    supabase.from("locations").select("id,name").eq("company_id", membership.company_id)
      .eq("active", true).order("name").limit(100),
  ]);
  if (countResult.error || eligibleResult.error || toolsResult.error || activityResult.error || locationsResult.error) throw new Error("Worker activity could not be loaded.");
  const toolIds = [...new Set((activityResult.data ?? []).map((event) => event.tool_id))];
  const { data: eventTools, error: eventToolError } = toolIds.length
    ? await supabase.from("tools").select("id,name").eq("company_id", membership.company_id).in("id", toolIds)
    : { data: [], error: null };
  if (eventToolError) throw new Error("Activity tools could not be loaded.");
  const toolNames = new Map((eventTools ?? []).map((tool) => [tool.id, tool.name]));
  const toolCount = countResult.count ?? 0;
  const canReturnAll = toolCount > 0 && toolCount <= 100 && toolCount === (eligibleResult.count ?? 0) && Boolean(locationsResult.data?.length);
  const notice = (await searchParams).notice;

  return <main className="service-page">
    <header><Link href="/app/workers">← Workers</Link><p className="service-eyebrow">FIELD WORKER</p><h1>{worker.name}</h1><p>{worker.status === "active" ? "Active field worker" : "Inactive field worker"} · Employee code: {worker.employee_code || "Not set"}. PINs and secret hashes are never shown here.</p></header>
    {notice && <p className="service-notice" role={notice === "returned" ? "status" : "alert"}>{notice === "returned" ? "All assigned tools were returned and each movement was added to history." : notice === "state" ? "At least one assigned tool is not checked out. Resolve it individually before returning all tools." : notice === "limit" ? "More than 100 tools are assigned. Return tools individually or contact support." : notice === "empty" ? "This worker has no tools to return." : notice === "invalid" ? "Choose a valid return location." : "The return could not be completed. No tools were changed."}</p>}
    <div className="service-grid"><section className="service-card"><h2>Current tools ({toolCount})</h2>{toolsResult.data?.length ? <ul className="service-list">{toolsResult.data.map((tool) => <li key={tool.id}><Link href={`/app/tools/${tool.id}`}><strong>{tool.name}</strong></Link><small>{tool.asset_code} · {tool.status.replaceAll("_", " ")}</small></li>)}</ul> : <p>No tools currently assigned to this worker.</p>}{toolCount > 25 && <p>Showing the first 25 tools. Use workspace search to find another tool.</p>}</section><section className="service-card"><h2>Recent activity</h2>{activityResult.data?.length ? <ul className="service-list">{activityResult.data.map((event) => <li key={event.id}><Link href={`/app/tools/${event.tool_id}`}><strong>{toolNames.get(event.tool_id) ?? "Tool record"}</strong></Link><small>{event.transaction_type.replaceAll("_", " ")} · {new Date(event.created_at).toLocaleString("en-US", { timeZone: "UTC" })} UTC</small></li>)}</ul> : <p>No recent movements involving this worker.</p>}<p>Showing the latest 10 events. Full history remains on each tool.</p></section></div>
    <section className="service-card" style={{ marginTop: 16 }}><h2>Return all assigned tools</h2><p>Return up to 100 checked-out tools to one active location. Every return is recorded in tool history; if any tool cannot be returned, none are changed.</p>{canReturnAll ? <form action={returnAllWorkerTools}><input type="hidden" name="workerId" value={worker.id} /><label htmlFor="return-all-location">Return location</label><select id="return-all-location" name="locationId" required defaultValue=""><option value="" disabled>Select location</option>{locationsResult.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><button type="submit">Return {toolCount} tools</button></form> : <p>{toolCount === 0 ? "No tools are assigned to this worker." : toolCount > 100 ? "More than 100 tools are assigned; use individual tool pages or contact support." : toolCount !== (eligibleResult.count ?? 0) ? "Some assigned tools are not checked out. Resolve those tools individually first." : "Add an active location before returning tools."}</p>}</section>
    <section className="service-card" style={{ marginTop: 16 }}><h2>Field access</h2><p>Resetting the PIN or deactivating this worker ends existing field sessions without changing tool history.</p><p><Link href={`/app/workers/${worker.id}/security`}>Reset PIN →</Link>{worker.status === "active" && <> · <Link href={`/app/workers/${worker.id}/deactivate`}>Deactivate worker →</Link></>}</p></section>
  </main>;
}
