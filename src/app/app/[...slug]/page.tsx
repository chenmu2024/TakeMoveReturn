import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell, type ActivityRecord, type BillingState, type CompanySettings, type DashboardStats, type PrivacyRequest, type SearchResult, type WorkspaceInvitation, type WorkspaceMember, type WorkspaceView } from "../../../components/workspace";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import "../service.css";

const views: Record<string, WorkspaceView> = {
  dashboard: { key: "dashboard", title: "Workspace dashboard", summary: "A clear starting point for tool custody, locations, exceptions, and the next handoff.", eyebrow: "DASHBOARD", kind: "dashboard", primaryAction: { label: "Add first tool", href: "/app/tools" } },
  search: { key: "search", title: "Search workspace", summary: "Find tools, field workers, trucks, warehouses, and job sites in your company.", eyebrow: "SEARCH", kind: "search" },
  tools: { key: "tools", title: "Tools", summary: "Register reusable tools with company-scoped asset codes and current status. Field custody and QR actions follow after security checks.", eyebrow: "TOOLS", kind: "table", columns: ["Tool", "Asset code", "Status", "Updated"], primaryAction: { label: "Add tool", href: "/app/tools/new" }, secondaryAction: { label: "Import list", href: "/app/import" }, emptyTitle: "No tools yet", emptyText: "Add the first reusable tool to begin your company register." },
  workers: { key: "workers", title: "Field workers", summary: "Register workers and manage their field access.", eyebrow: "WORKERS", kind: "table", columns: ["Worker", "Employee code", "Status", "Security"], primaryAction: { label: "Add worker", href: "/app/workers/new" }, secondaryAction: { label: "Field devices", href: "/app/workers/devices" }, emptyTitle: "No workers yet", emptyText: "Add a field worker to prepare for secure tool handoffs." },
  locations: { key: "locations", title: "Locations", summary: "Track warehouses, trucks, job sites, and the places where tools are handed off.", eyebrow: "LOCATIONS", kind: "table", columns: ["Location", "Type", "Address", "Status", "Updated"], primaryAction: { label: "Add location", href: "/app/locations/new" }, emptyTitle: "No locations yet", emptyText: "Add a warehouse, job site, truck, or other place where tools are kept." },
  activity: { key: "activity", title: "Activity", summary: "Review durable TAKE, MOVE, RETURN, damage, maintenance, and correction events.", eyebrow: "ACTIVITY", kind: "activity", secondaryAction: { label: "Export history", href: "/app/reports" }, emptyTitle: "No transactions yet", emptyText: "Events will appear here after the first authenticated tool movement." },
  damage: { key: "damage", title: "Damage reports", summary: "Keep reported damage, repair status, evidence, and the affected tool together.", eyebrow: "DAMAGE", kind: "table", columns: ["Tool", "Reported by", "Severity", "Status", "Reported"], primaryAction: { label: "Report damage", href: "/app/damage" }, emptyTitle: "No damage reports", emptyText: "Damage reports will appear here after secure tool records and attachments are connected." },
  maintenance: { key: "maintenance", title: "Maintenance", summary: "Schedule service, track repair history, costs, due dates, and attachments.", eyebrow: "MAINTENANCE", kind: "table", columns: ["Tool", "Service", "Due", "Status", "Last service"], primaryAction: { label: "Add maintenance", href: "/app/maintenance" }, emptyTitle: "No maintenance records", emptyText: "Maintenance records will appear here after authenticated company data is connected." },
  import: { key: "import", title: "Import tools", summary: "Review CSV or XLSX data, check company duplicates and capacity, then start a background batch import.", eyebrow: "IMPORT", kind: "import", emptyTitle: "No import started", emptyText: "Preview alone does not create tools." },
  reports: { key: "reports", title: "Reports", summary: "Download company-scoped CSV exports for tools, workers, locations, transactions, damage, and service history.", eyebrow: "REPORTS", kind: "reports", emptyTitle: "Reports are not connected", emptyText: "Reports will be generated from authenticated company data, never from sample records." },
  settings: { key: "settings", title: "Workspace settings", summary: "Manage company identity and timezone, review your access role, and open billing or privacy settings.", eyebrow: "SETTINGS", kind: "settings", secondaryAction: { label: "Review privacy", href: "/app/settings/privacy" } },
  "settings/billing": { key: "settings/billing", title: "Billing", summary: "Review plan capacity, billing interval, subscription status, and the checkout actions currently available.", eyebrow: "BILLING", kind: "billing" },
  "settings/privacy": { key: "settings/privacy", title: "Privacy", summary: "Request personal-data export, account deletion, and privacy workflow status.", eyebrow: "PRIVACY", kind: "privacy" },
};

export default async function WorkspacePage({ params, searchParams }: { params: Promise<{ slug: string[] }>; searchParams: Promise<{ notice?: string; q?: string | string[] }> }) {
  const path = "/app/" + (await params).slug.join("/");
  const key = path.replace(/^\/app\//, "");
  const view = views[key];
  if (!view) notFound();
  let tools = null;
  let locations = null;
  let workers = null;
  let dashboardStats = null;
  let activity: ActivityRecord[] | null = null;
  let attentionTools = null;
  let companySettings: CompanySettings | null = null;
  let workspaceMembers: WorkspaceMember[] | null = null;
  let workspaceInvitations: WorkspaceInvitation[] | null = null;
  let billing: BillingState | null = null;
  let privacyRequests: PrivacyRequest[] | null = null;
  let reportAccess = false;
  let reportConnected = false;
  let searchConnected = false;
  let searchResults: SearchResult[] | null = null;
  const queryValue = (await searchParams).q;
  const searchQuery = typeof queryValue === "string" ? queryValue.trim() : "";
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) redirect("/auth/login");
    const { data: membership, error } = await supabase.from("organization_members")
      .select("company_id,role").eq("user_id", data.claims.sub).eq("status", "active").limit(1).maybeSingle();
    if (error) throw new Error("Workspace membership could not be checked.");
    if (!membership) redirect("/app/onboarding");
    searchConnected = key === "search";
    if (key === "search" && searchQuery.length >= 2 && searchQuery.length <= 100) {
      const { data: matches, error: searchError } = await supabase.rpc("search_workspace", {
        p_company_id: membership.company_id, p_query: searchQuery,
      });
      if (searchError) throw new Error("Workspace search could not be loaded.");
      searchResults = matches ?? [];
    }
    if (key === "settings/privacy") {
      const { data: requests, error: requestsError } = await supabase.from("privacy_requests")
        .select("id,request_type,status,created_at,completed_at")
        .eq("requester_user_id", data.claims.sub).order("created_at", { ascending: false }).limit(10);
      if (requestsError) throw new Error("Privacy requests could not be loaded.");
      privacyRequests = requests ?? [];
    }
    reportConnected = key === "reports";
    reportAccess = reportConnected && (membership.role === "owner" || membership.role === "admin");
    if (key === "settings") {
      const { data: company, error: companyError } = await supabase.from("companies")
        .select("name,plan,timezone").eq("id", membership.company_id).single();
      if (companyError) throw new Error("Company settings could not be loaded.");
      companySettings = {
        name: company.name,
        plan: company.plan as CompanySettings["plan"],
        timezone: company.timezone,
        role: membership.role,
      };
      if (membership.role === "owner" || membership.role === "admin") {
        const { data: memberRows, error: memberError } = await supabase.rpc("list_workspace_members", {
          p_company_id: membership.company_id,
        });
        if (memberError) throw new Error("Workspace members could not be loaded.");
        workspaceMembers = (memberRows ?? []) as WorkspaceMember[];
      }
      if (membership.role === "owner") {
        const { data: inviteRows, error: inviteError } = await supabase.from("workspace_invitations")
          .select("id,email,role,status,expires_at,created_at")
          .eq("company_id", membership.company_id)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });
        if (inviteError) throw new Error("Workspace invitations could not be loaded.");
        workspaceInvitations = (inviteRows ?? []) as WorkspaceInvitation[];
      }
    }
    if (key === "settings/billing") {
      const [
        { data: company, error: companyError },
        { data: subscription, error: subscriptionError },
        { data: pendingPlanChange, error: pendingPlanChangeError },
        { count: activeTools, error: toolCountError },
        { count: admins, error: adminCountError },
      ] = await Promise.all([
        supabase.from("companies").select("plan").eq("id", membership.company_id).single(),
        supabase.from("billing_subscriptions").select("plan,status,billing_interval,current_period_end")
          .eq("company_id", membership.company_id).maybeSingle(),
        supabase.from("billing_plan_change_intents")
          .select("to_plan,to_billing_interval,timing,status")
          .eq("company_id", membership.company_id)
          .in("status", ["pending", "session_created", "scheduled"])
          .order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("tools").select("id", { count: "exact", head: true })
          .eq("company_id", membership.company_id).neq("status", "retired"),
        supabase.from("organization_members").select("id", { count: "exact", head: true })
          .eq("company_id", membership.company_id).eq("status", "active"),
      ]);
      if (companyError || subscriptionError || pendingPlanChangeError || toolCountError || adminCountError) throw new Error("Billing state could not be loaded.");
      billing = {
        plan: company.plan as BillingState["plan"], subscriptionPlan: (subscription?.plan as BillingState["subscriptionPlan"]) ?? null, role: membership.role,
        status: subscription?.status ?? null, billingInterval: subscription?.billing_interval ?? null,
        periodEnd: subscription?.current_period_end ?? null,
        enabled: process.env.WAFFO_BILLING_ENABLED === "true",
        activeTools: activeTools ?? 0,
        admins: admins ?? 0,
        storageBytes: 0,
        pendingPlanChange: pendingPlanChange ? {
          plan: pendingPlanChange.to_plan as "starter" | "growth" | "pro",
          billingInterval: pendingPlanChange.to_billing_interval as "month" | "year",
          timing: pendingPlanChange.timing as "immediate" | "next_period",
          status: pendingPlanChange.status,
        } : null,
      };
    }
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
    if (key === "activity" || key === "dashboard") {
      const { data: events, error: eventError } = await supabase.from("tool_transactions")
        .select("id,tool_id,transaction_type,notes,created_at").eq("company_id", membership.company_id)
        .order("created_at", { ascending: false }).limit(key === "dashboard" ? 5 : 100);
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
      const { data: attentionRows, error: attentionError } = await supabase.from("tools")
        .select("id,name,asset_code,status,updated_at").eq("company_id", membership.company_id)
        .in("status", ["damaged", "maintenance", "missing"])
        .order("updated_at", { ascending: false }).limit(5);
      if (attentionError) throw new Error("Attention items could not be loaded.");
      attentionTools = attentionRows;
      const recentSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [total, checkedOut, needsAttention, recentActivity, companyPlan, adminCount] = await Promise.all([
        supabase.from("tools").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).neq("status", "retired"),
        supabase.from("tools").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("status", "checked_out"),
        supabase.from("tools").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).in("status", ["damaged", "maintenance", "missing"]),
        supabase.from("tool_transactions").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).gte("created_at", recentSince),
        supabase.from("companies").select("plan").eq("id", membership.company_id).single(),
        supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("status", "active"),
      ]);
      if (total.error || checkedOut.error || needsAttention.error || recentActivity.error || companyPlan.error || adminCount.error) {
        throw new Error("Dashboard counts could not be loaded.");
      }
      dashboardStats = {
        totalTools: total.count ?? 0,
        checkedOut: checkedOut.count ?? 0,
        needsAttention: needsAttention.count ?? 0,
        recentActivity: recentActivity.count ?? 0,
        plan: companyPlan.data.plan as DashboardStats["plan"],
        admins: adminCount.count ?? 0,
        storageBytes: 0,
      };
    }
  }
  return <WorkspaceShell path={path} view={view} tools={tools} locations={locations} workers={workers} dashboardStats={dashboardStats} activity={activity} attentionTools={attentionTools} companySettings={companySettings} workspaceMembers={workspaceMembers} workspaceInvitations={workspaceInvitations} billing={billing} privacyRequests={privacyRequests} reportAccess={reportAccess} reportConnected={reportConnected} searchConnected={searchConnected} searchQuery={searchQuery} searchResults={searchResults} notice={(await searchParams).notice} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const key = (await params).slug.join("/");
  const view = views[key];
  if (!view) return { robots: { index: false, follow: false } };
  return { title: `${view.title} | TakeMoveReturn`, description: view.summary, robots: { index: false, follow: false } };
}
