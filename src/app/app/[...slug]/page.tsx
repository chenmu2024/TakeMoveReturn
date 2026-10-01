import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceShell, type ActivityRecord, type BillingState, type CompanySettings, type DashboardStats, type OverdueTool, type PrivacyRequest, type SearchResult, type WorkspaceInvitation, type WorkspaceMember, type WorkspaceView } from "../../../components/workspace";
import { customerFilesEnabled } from "../../../lib/files/customer-files";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import "../service.css";

const views: Record<string, WorkspaceView> = {
  dashboard: { key: "dashboard", title: "Workspace dashboard", summary: "A clear starting point for tool custody, locations, exceptions, and the next handoff.", eyebrow: "DASHBOARD", kind: "dashboard", primaryAction: { label: "Add first tool", href: "/app/tools" } },
  search: { key: "search", title: "Search workspace", summary: "Find tools, field workers, trucks, warehouses, and job sites in your company.", eyebrow: "SEARCH", kind: "search" },
  tools: { key: "tools", title: "Tools", summary: "See who holds each tool, print QR labels, or import your existing list. Every field move is recorded.", eyebrow: "TOOLS", kind: "table", columns: ["Tool", "Asset code", "Status", "Updated"], primaryAction: { label: "Add tool", href: "/app/tools/new" }, secondaryAction: { label: "Print QR labels", href: "/app/tools/labels" }, emptyTitle: "No tools yet", emptyText: "Add or import a tool to create its first QR label." },
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

export default async function WorkspacePage({ params, searchParams }: { params: Promise<{ slug: string[] }>; searchParams: Promise<{ notice?: string; q?: string | string[]; page?: string | string[]; overdue?: string }> }) {
  const path = "/app/" + (await params).slug.join("/");
  const key = path.replace(/^\/app\//, "");
  const queryParams = await searchParams;
  const overdueOnly = key === "tools" && queryParams.overdue === "1";
  const view = overdueOnly ? { ...views.tools, title: "Overdue tools", summary: "Checked-out tools past their expected return date. Open a tool to review its holder and follow up.", columns: ["Tool", "Asset code", "Status", "Expected return"] } : views[key];
  if (!view) notFound();
  const pageValue = queryParams.page;
  const page = typeof pageValue === "string" && /^[1-9]\d{0,3}$/.test(pageValue) ? Number(pageValue) : 1;
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  let pageCount = 1;
  let recordCount = 0;
  let tools = null;
  let locations = null;
  let workers = null;
  let dashboardStats = null;
  let activity: ActivityRecord[] | null = null;
  let attentionTools = null;
  let overdueTools: OverdueTool[] | null = null;
  let overdueCount = 0;
  let companySettings: CompanySettings | null = null;
  let workspaceTimezone = "UTC";
  let workspaceMembers: WorkspaceMember[] | null = null;
  let workspaceInvitations: WorkspaceInvitation[] | null = null;
  let billing: BillingState | null = null;
  let privacyRequests: PrivacyRequest[] | null = null;
  let reportAccess = false;
  let reportConnected = false;
  let searchConnected = false;
  let searchResults: SearchResult[] | null = null;
  const queryValue = queryParams.q;
  const searchQuery = typeof queryValue === "string" ? queryValue.trim() : "";
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) redirect("/auth/login");
    const { data: membership, error } = await supabase.from("organization_members")
      .select("company_id,role").eq("user_id", data.claims.sub).eq("status", "active").limit(1).maybeSingle();
    if (error) throw new Error("Workspace membership could not be checked.");
    if (!membership) redirect("/app/onboarding");
    if (key === "dashboard" || key === "tools") {
      const { data: timezoneRow, error: timezoneError } = await supabase.from("companies")
        .select("timezone").eq("id", membership.company_id).maybeSingle();
      if (timezoneError) throw new Error("Workspace timezone could not be loaded.");
      workspaceTimezone = timezoneRow?.timezone || "UTC";
    }
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
      let storageBytes: number | null = customerFilesEnabled() ? null : 0;
      if (customerFilesEnabled()) {
        const { data: usage, error: usageError } = await supabase.rpc("customer_file_usage", { p_company_id: membership.company_id });
        if (usageError) console.error("Storage usage unavailable", { code: usageError.code });
        else storageBytes = Number(usage ?? 0);
      }
      billing = {
        plan: company.plan as BillingState["plan"], subscriptionPlan: (subscription?.plan as BillingState["subscriptionPlan"]) ?? null, role: membership.role,
        status: subscription?.status ?? null, billingInterval: subscription?.billing_interval ?? null,
        periodEnd: subscription?.current_period_end ?? null,
        enabled: process.env.WAFFO_BILLING_ENABLED === "true",
        activeTools: activeTools ?? 0,
        admins: admins ?? 0,
        storageBytes,
        pendingPlanChange: pendingPlanChange ? {
          plan: pendingPlanChange.to_plan as "starter" | "growth" | "pro",
          billingInterval: pendingPlanChange.to_billing_interval as "month" | "year",
          timing: pendingPlanChange.timing as "immediate" | "next_period",
          status: pendingPlanChange.status,
        } : null,
      };
    }
    if (key === "tools") {
      let toolQuery = supabase.from("tools")
        .select("id,name,asset_code,status,updated_at,expected_return_at", { count: "exact" }).eq("company_id", membership.company_id);
      if (overdueOnly) toolQuery = toolQuery.eq("status", "checked_out").lt("expected_return_at", new Date().toISOString());
      const { data: toolRows, count, error: toolError } = await toolQuery
        .order(overdueOnly ? "expected_return_at" : "updated_at", { ascending: overdueOnly })
        .order("id", { ascending: true }).range(offset, offset + pageSize - 1);
      if (toolError) throw new Error("Tools could not be loaded.");
      tools = toolRows;
      recordCount = count ?? 0;
    }
    if (key === "locations") {
      const { data: locationRows, count, error: locationError } = await supabase.from("locations")
        .select("id,name,type,address,active,updated_at", { count: "exact" }).eq("company_id", membership.company_id)
        .order("updated_at", { ascending: false }).order("id", { ascending: true }).range(offset, offset + pageSize - 1);
      if (locationError) throw new Error("Locations could not be loaded.");
      locations = locationRows;
      recordCount = count ?? 0;
    }
    if (key === "workers") {
      const { data: workerRows, count, error: workerError } = await supabase.from("workers")
        .select("id,name,employee_code,status,updated_at", { count: "exact" }).eq("company_id", membership.company_id)
        .order("updated_at", { ascending: false }).order("id", { ascending: true }).range(offset, offset + pageSize - 1);
      if (workerError) throw new Error("Workers could not be loaded.");
      workers = workerRows;
      recordCount = count ?? 0;
    }
    if (key === "activity" || key === "dashboard") {
      const { data: events, count, error: eventError } = await supabase.from("tool_transactions")
        .select("id,tool_id,transaction_type,notes,created_at", key === "activity" ? { count: "exact" } : {})
        .eq("company_id", membership.company_id)
        .order("created_at", { ascending: false }).order("id", { ascending: true })
        .range(key === "dashboard" ? 0 : offset, key === "dashboard" ? 4 : offset + pageSize - 1);
      if (eventError) throw new Error("Tool activity could not be loaded.");
      if (key === "activity") recordCount = count ?? 0;
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
    if (["tools", "locations", "workers", "activity"].includes(key)) {
      pageCount = Math.max(1, Math.ceil(recordCount / pageSize));
      if (page > pageCount) notFound();
    }
    if (key === "dashboard") {
      const { data: overdueRows, count, error: overdueError } = await supabase.from("tools")
        .select("id,name,asset_code,expected_return_at", { count: "exact" }).eq("company_id", membership.company_id)
        .eq("status", "checked_out").not("expected_return_at", "is", null)
        .lt("expected_return_at", new Date().toISOString())
        .order("expected_return_at", { ascending: true }).limit(10);
      if (overdueError) console.error("Overdue returns unavailable", { code: overdueError.code });
      else {
        overdueTools = (overdueRows ?? []).filter((row): row is OverdueTool => row.expected_return_at !== null);
        overdueCount = count ?? 0;
      }
      const { data: attentionRows, error: attentionError } = await supabase.from("tools")
        .select("id,name,asset_code,status,updated_at").eq("company_id", membership.company_id)
        .in("status", ["damaged", "maintenance", "missing"])
        .order("updated_at", { ascending: false }).limit(5);
      if (attentionError) throw new Error("Attention items could not be loaded.");
      attentionTools = attentionRows;
      const recentSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [total, checkedOut, needsAttention, recentActivity, companyPlan, adminCount, activeLocations, activeWorkers, firstFieldTake, firstFieldReturn] = await Promise.all([
        supabase.from("tools").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).neq("status", "retired"),
        supabase.from("tools").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("status", "checked_out"),
        supabase.from("tools").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).in("status", ["damaged", "maintenance", "missing"]),
        supabase.from("tool_transactions").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).gte("created_at", recentSince),
        supabase.from("companies").select("plan").eq("id", membership.company_id).single(),
        supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("status", "active"),
        supabase.from("locations").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("active", true),
        supabase.from("workers").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("status", "active"),
        supabase.from("tool_transactions").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("transaction_type", "checkout").not("performed_by_worker_id", "is", null),
        supabase.from("tool_transactions").select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).eq("transaction_type", "return").not("performed_by_worker_id", "is", null),
      ]);
      if (total.error || checkedOut.error || needsAttention.error || recentActivity.error || companyPlan.error || adminCount.error) {
        throw new Error("Dashboard counts could not be loaded.");
      }
      const setupAvailable = !activeLocations.error && !activeWorkers.error && !firstFieldTake.error && !firstFieldReturn.error;
      if (!setupAvailable) console.error("Setup progress unavailable", { codes: [activeLocations.error?.code, activeWorkers.error?.code, firstFieldTake.error?.code, firstFieldReturn.error?.code] });
      const [{ data: activation, error: activationError }, { data: firstScan, error: firstScanError }] = await Promise.all([
        supabase.from("companies").select("activation_started_at").eq("id", membership.company_id).maybeSingle(),
        supabase.from("first_authenticated_scans").select("scanned_at").eq("company_id", membership.company_id).maybeSingle(),
      ]);
      if (activationError || firstScanError) console.error("First scan measurement unavailable", { codes: [activationError?.code, firstScanError?.code] });
      let storageBytes: number | null = customerFilesEnabled() ? null : 0;
      if (customerFilesEnabled()) {
        const { data: usage, error: usageError } = await supabase.rpc("customer_file_usage", { p_company_id: membership.company_id });
        if (usageError) console.error("Storage usage unavailable", { code: usageError.code });
        else storageBytes = Number(usage ?? 0);
      }
      dashboardStats = {
        totalTools: total.count ?? 0,
        checkedOut: checkedOut.count ?? 0,
        needsAttention: needsAttention.count ?? 0,
        recentActivity: recentActivity.count ?? 0,
        plan: companyPlan.data.plan as DashboardStats["plan"],
        admins: adminCount.count ?? 0,
        storageBytes,
        setupAvailable,
        activeLocations: activeLocations.count ?? 0,
        activeWorkers: activeWorkers.count ?? 0,
        firstFieldTake: (firstFieldTake.count ?? 0) > 0,
        firstFieldReturn: (firstFieldReturn.count ?? 0) > 0,
        activationStartedAt: activationError || firstScanError ? null : activation?.activation_started_at ?? null,
        firstScanAt: firstScanError ? null : firstScan?.scanned_at ?? null,
      };
    }
  }
  return <WorkspaceShell path={path} view={view} workspaceTimezone={workspaceTimezone} tools={tools} locations={locations} workers={workers} dashboardStats={dashboardStats} activity={activity} attentionTools={attentionTools} overdueTools={overdueTools} overdueCount={overdueCount} overdueOnly={overdueOnly} page={page} pageCount={pageCount} recordCount={recordCount} companySettings={companySettings} workspaceMembers={workspaceMembers} workspaceInvitations={workspaceInvitations} billing={billing} privacyRequests={privacyRequests} reportAccess={reportAccess} reportConnected={reportConnected} searchConnected={searchConnected} searchQuery={searchQuery} searchResults={searchResults} notice={queryParams.notice} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const key = (await params).slug.join("/");
  const view = views[key];
  if (!view) return { robots: { index: false, follow: false } };
  return { title: `${view.title} | TakeMoveReturn`, description: view.summary, robots: { index: false, follow: false } };
}
