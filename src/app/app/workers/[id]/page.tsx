import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import "../../service.css";

export const metadata: Metadata = { title: "Worker | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function WorkerPage({ params }: { params: Promise<{ id: string }> }) {
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
  const [countResult, toolsResult, activityResult] = await Promise.all([
    supabase.from("tools").select("id", { count: "exact", head: true })
      .eq("company_id", membership.company_id).eq("current_worker_id", worker.id).neq("status", "retired"),
    supabase.from("tools").select("id,name,asset_code,status")
      .eq("company_id", membership.company_id).eq("current_worker_id", worker.id).neq("status", "retired")
      .order("name").limit(25),
    supabase.from("tool_transactions").select("id,tool_id,transaction_type,created_at")
      .eq("company_id", membership.company_id)
      .or(`from_worker_id.eq.${worker.id},to_worker_id.eq.${worker.id},performed_by_worker_id.eq.${worker.id}`)
      .order("created_at", { ascending: false }).limit(10),
  ]);
  if (countResult.error || toolsResult.error || activityResult.error) throw new Error("Worker activity could not be loaded.");
  const toolIds = [...new Set((activityResult.data ?? []).map((event) => event.tool_id))];
  const { data: eventTools, error: eventToolError } = toolIds.length
    ? await supabase.from("tools").select("id,name").eq("company_id", membership.company_id).in("id", toolIds)
    : { data: [], error: null };
  if (eventToolError) throw new Error("Activity tools could not be loaded.");
  const toolNames = new Map((eventTools ?? []).map((tool) => [tool.id, tool.name]));

  return <main className="service-page"><header><Link href="/app/workers">← Workers</Link><p className="service-eyebrow">FIELD WORKER</p><h1>{worker.name}</h1><p>{worker.status === "active" ? "Active field worker" : "Inactive field worker"} · Employee code: {worker.employee_code || "Not set"}. PINs and secret hashes are never shown here.</p></header><div className="service-grid"><section className="service-card"><h2>Current tools ({countResult.count ?? 0})</h2>{toolsResult.data?.length ? <ul className="service-list">{toolsResult.data.map((tool) => <li key={tool.id}><Link href={`/app/tools/${tool.id}`}><strong>{tool.name}</strong></Link><small>{tool.asset_code} · {tool.status.replaceAll("_", " ")}</small></li>)}</ul> : <p>No tools currently assigned to this worker.</p>}{(countResult.count ?? 0) > 25 && <p>Showing the first 25 tools. Use workspace search to find another tool.</p>}</section><section className="service-card"><h2>Recent activity</h2>{activityResult.data?.length ? <ul className="service-list">{activityResult.data.map((event) => <li key={event.id}><Link href={`/app/tools/${event.tool_id}`}><strong>{toolNames.get(event.tool_id) ?? "Tool record"}</strong></Link><small>{event.transaction_type.replaceAll("_", " ")} · {new Date(event.created_at).toLocaleString("en-US", { timeZone: "UTC" })} UTC</small></li>)}</ul> : <p>No recent movements involving this worker.</p>}<p>Showing the latest 10 events. Full history remains on each tool.</p></section></div><section className="service-card" style={{ marginTop: 16 }}><h2>Field access</h2><p>Resetting the PIN or deactivating this worker ends existing field sessions without changing tool history.</p><p><Link href={`/app/workers/${worker.id}/security`}>Reset PIN →</Link>{worker.status === "active" && <> · <Link href={`/app/workers/${worker.id}/deactivate`}>Deactivate worker →</Link></>}</p></section></main>;
}
