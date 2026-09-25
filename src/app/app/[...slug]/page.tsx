import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell, type ActivityRecord, type WorkspaceView } from "../../../components/workspace";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

const views: Record<string, WorkspaceView> = {
  dashboard: { key: "dashboard", title: "Workspace dashboard", summary: "A clear starting point for tool custody, locations, exceptions, and the next handoff.", eyebrow: "DASHBOARD", kind: "dashboard", primaryAction: { label: "Add first tool", href: "/app/tools" } },
  tools: { key: "tools", title: "Tools", summary: "Register reusable tools with company-scoped asset codes and current status. Field custody and QR actions follow after security checks.", eyebrow: "TOOLS", kind: "table", columns: ["Tool", "Asset code", "Status", "Updated"], primaryAction: { label: "Add tool", href: "/app/tools/new" }, secondaryAction: { label: "Import list", href: "/app/import" }, emptyTitle: "No tools yet", emptyText: "Add the first reusable tool to begin your company register." },
  workers: { key: "workers", title: "Field workers", summary: "Register workers and manage their field access.", eyebrow: "WORKERS", kind: "table", columns: ["Worker", "Employee code", "Status", "Security"], primaryAction: { label: "Add worker", href: "/app/workers/new" }, emptyTitle: "No workers yet", emptyText: "Add a field worker to prepare for secure tool handoffs." },
  locations: { key: "locations", title: "Locations", summary: "Track warehouses, trucks, job sites, and the places where tools are handed off.", eyebrow: "LOCATIONS", kind: "table", columns: ["Location", "Type", "Address", "Status", "Updated"], primaryAction: { label: "Add location", href: "/app/locations/new" }, emptyTitle: "No locations yet", emptyText: "Add a warehouse, job site, truck, or other place where tools are kept." },
  activity: { key: "activity", title: "Activity", summary: "Review durable TAKE, MOVE, RETURN, damage, maintenance, and correction events.", eyebrow: "ACTIVITY", kind: "activity", secondaryAction: { label: "Export history", href: "/app/reports" }, emptyTitle: "No transactions yet", emptyText: "Events will appear here after the first authenticated tool movement." },
  damage: { key: "damage", title: "Damage reports", summary: "Keep reported damage, repair status, evidence, and the affected tool together.", eyebrow: "DAMAGE", kind: "table", columns: ["Tool", "Reported by", "Severity", "Status", "Reported"], primaryAction: { label: "Report damage", href: "/app/damage" }, emptyTitle: "No damage reports", emptyText: "Damage reports will appear here after secure tool records and attachments are connected." },
  maintenance: { key: "maintenance", title: "Maintenance", summary: "Schedule service, track repair history, costs, due dates, and attachments.", eyebrow: "MAINTENANCE", kind: "table", columns: ["Tool", "Service", "Due", "Status", "Last service"], primaryAction: { label: "Add maintenance", href: "/app/maintenance" }, emptyTitle: "No maintenance records", emptyText: "Maintenance records will appear here after authenticated company data is connected." },
  import: { key: "import", title: "Import tools", summary: "Plan a safe CSV or XLSX migration with validation, preview, batching, and recovery.", eyebrow: "IMPORT", kind: "import", primaryAction: { label: "Choose source file", href: "/app/import" }, emptyTitle: "No import started", emptyText: "Import processing requires Supabase, R2, Queue, and server-side validation." },
  reports: { key: "reports", title: "Reports", summary: "Prepare company-scoped exports for tools, workers, locations, transactions, maintenance, and damage.", eyebrow: "REPORTS", kind: "reports", emptyTitle: "Reports are not connected", emptyText: "Reports will be generated from authenticated company data, never from sample records." },
  settings: { key: "settings", title: "Workspace settings", summary: "Manage company identity, memberships, storage usage, and operational preferences.", eyebrow: "SETTINGS", kind: "settings", secondaryAction: { label: "Review privacy", href: "/app/settings/privacy" } },
  "settings/billing": { key: "settings/billing", title: "Billing", summary: "Manage monthly or annual capacity plans, upgrades, downgrades, and limits.", eyebrow: "BILLING", kind: "billing" },
  "settings/privacy": { key: "settings/privacy", title: "Privacy", summary: "Request personal-data export, account deletion, and privacy workflow status.", eyebrow: "PRIVACY", kind: "privacy" },
};

export default async function WorkspacePage({ params, searchParams }: { params: Promise<{ slug: string[] }>; searchParams: Promise<{ notice?: string }> }) {
  const path = "/app/" + (await params).slug.join("/");
  const key = path.replace(/^\/app\//, "");
  const view = views[key];
  if (!view) notFound();
  let tools = null;
  let locations = null;
  let workers = null;
  let dashboardStats = null;
  let activity: ActivityRecord[] | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) redirect("/auth/login");
    const { data: membership, error } = await supabase.from("organization_members")
      .select("company_id").eq("user_id", data.claims.sub).eq("status", "active").limit(1).maybeSingle();
    if (error) throw new Error("Workspace membership could not be checked.");
    if (!membership) redirect("/app/onboarding");
    if (key === "tools") {
      const { data: toolRows, error: toolError } = await supabase.from("tools")
        .select("id,name,asset_code,status,updated_at").eq("company_id", membership.company_id)
        .order("updated_at", { ascending: false }).limit(100);
      if (toolError) throw new Error("Tools could not be loaded.");
      tools = toolRows;
    }
    if (key === "locations") {
      const { data: locationRows, error: locationError } = await supabase.from("locations")
        .select("id,name,type,address,active,updated_at").eq("company_id", membership.company_id)
        .order("updated_at", { ascending: false }).limit(100);
      if (locationError) throw new Error("Locations could not be loaded.");
      locations = locationRows;
    }
    if (key === "workers") {
      const { data: workerRows, error: workerError } = await supabase.from("workers")
        .select("id,name,employee_code,status,updated_at").eq("company_id", membership.company_id)
        .order("updated_at", { ascending: false }).limit(100);
      if (workerError) throw new Error("Workers could not be loaded.");
      workers = workerRows;
    }
    if (key === "activity") {
      const { data: events, error: eventError } = await supabase.from("tool_transactions")
        .select("id,tool_id,transaction_type,notes,created_at").eq("company_id", membership.company_id)
        .order("created_at", { ascending: false }).limit(100);
      if (eventError) throw new Error("Tool activity could not be loaded.");
      const toolIds = [...new Set((events ?? []).map((event) => event.tool_id))];
      const { data: eventTools, error: eventToolError } = toolIds.length
        ? await supabase.from("tools").select("id,name,asset_code").eq("company_id", membership.company_id).in("id", toolIds)
        : { data: [], error: null };
      if (eventToolError) throw new Error("Activity tools could not be loaded.");
      const toolById = new Map((eventTools ?? []).map((tool) => [tool.id, tool]));
      activity = (events ?? []).map((event) => ({
        id: event.id,
        toolId: event.tool_id,
        toolName: toolById.get(event.tool_id)?.name ?? "Unknown tool",
        assetCode: toolById.get(event.tool_id)?.asset_code ?? "—",
        type: event.transaction_type,
        notes: event.notes,
        createdAt: event.created_at,
      }));
    }
    if (key === "dashboard") {
      const recentSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [total, checkedOut, needsAttention, recentActivity] = await Promise.all([
        supabase.from("tools").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).neq("status", "retired"),
        supabase.from("tools").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("status", "checked_out"),
        supabase.from("tools").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).in("status", ["damaged", "maintenance", "missing"]),
        supabase.from("tool_transactions").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).gte("created_at", recentSince),
      ]);
      if (total.error || checkedOut.error || needsAttention.error || recentActivity.error) {
        throw new Error("Dashboard counts could not be loaded.");
      }
      dashboardStats = {
        totalTools: total.count ?? 0,
        checkedOut: checkedOut.count ?? 0,
        needsAttention: needsAttention.count ?? 0,
        recentActivity: recentActivity.count ?? 0,
      };
    }
  }
  return <WorkspaceShell path={path} view={view} tools={tools} locations={locations} workers={workers} dashboardStats={dashboardStats} activity={activity} notice={(await searchParams).notice} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const key = (await params).slug.join("/");
  const view = views[key];
  if (!view) return { robots: { index: false, follow: false } };
  return { title: `${view.title} | TakeMoveReturn`, description: view.summary, robots: { index: false, follow: false } };
}
