import Link from "next/link";
import { IconArrowRight, IconLock, IconPlus, IconRefresh } from "@tabler/icons-react";

export type WorkspaceView = {
  key: string;
  title: string;
  summary: string;
  eyebrow: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  kind: "dashboard" | "table" | "activity" | "import" | "reports" | "settings" | "billing" | "privacy";
  columns?: string[];
  emptyTitle?: string;
  emptyText?: string;
};

export type ToolSummary = { id: string; name: string; asset_code: string; status: string; updated_at: string };
export type LocationSummary = { id: string; name: string; type: string; address: string | null; active: boolean; updated_at: string };
export type WorkerSummary = { id: string; name: string; employee_code: string | null; status: string; updated_at: string };
export type DashboardStats = { totalTools: number; checkedOut: number; needsAttention: number; recentActivity: number };

const navigation = [
  { label: "Dashboard", href: "/app/dashboard", key: "dashboard" },
  { label: "Tools", href: "/app/tools", key: "tools" },
  { label: "Workers", href: "/app/workers", key: "workers" },
  { label: "Locations", href: "/app/locations", key: "locations" },
  { label: "Activity", href: "/app/activity", key: "activity" },
  { label: "Damage", href: "/app/damage", key: "damage" },
  { label: "Maintenance", href: "/app/maintenance", key: "maintenance" },
  { label: "Import", href: "/app/import", key: "import" },
  { label: "Reports", href: "/app/reports", key: "reports" },
];

const settingsNavigation = [
  { label: "Settings", href: "/app/settings", key: "settings" },
  { label: "Billing", href: "/app/settings/billing", key: "settings/billing" },
  { label: "Privacy", href: "/app/settings/privacy", key: "settings/privacy" },
];

function isActive(path: string, href: string) {
  return path === href || (href !== "/app/dashboard" && path.startsWith(`${href}/`));
}

function ActionLink({ action, quiet = false }: { action: WorkspaceView["primaryAction"]; quiet?: boolean }) {
  if (!action) return null;
  return <Link className={quiet ? "workspace-button workspace-button-quiet" : "workspace-button"} href={action.href}>{action.label}<IconArrowRight size={16} aria-hidden="true" /></Link>;
}

function WorkspaceEmptyState({ view }: { view: WorkspaceView }) {
  return <section className="workspace-empty"><div className="workspace-empty-icon"><IconRefresh size={22} aria-hidden="true" /></div><h2>{view.emptyTitle ?? `No ${view.title.toLowerCase()} yet`}</h2><p>{view.emptyText ?? "Connect the secure workspace data source to load this view."}</p>{view.primaryAction && <ActionLink action={view.primaryAction} />}</section>;
}

function DashboardContent({ stats }: { stats: DashboardStats | null }) {
  const cards = [
    { label: "Active tools", value: stats?.totalTools, note: "Excludes retired tools" },
    { label: "Checked out", value: stats?.checkedOut, note: "Currently with workers" },
    { label: "Needs attention", value: stats?.needsAttention, note: "Damaged, missing, or in maintenance" },
    { label: "Recent activity", value: stats?.recentActivity, note: "Events in the last 7 days" },
  ];
  return <>
    <section className="workspace-stat-grid" aria-label="Workspace overview">
      {cards.map((card) => <article className="workspace-stat" key={card.label}><span>{card.label}</span><strong>{card.value ?? "—"}</strong><small>{stats ? card.note : "Awaiting workspace data"}</small></article>)}
    </section>
    <section className="workspace-panel-grid">
      <article className="workspace-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">RECENT ACTIVITY</p><h2>Keep every handoff visible.</h2></div><Link href="/app/activity">View activity <IconArrowRight size={15} aria-hidden="true" /></Link></div><WorkspaceEmptyState view={{ key: "activity", title: "Activity", summary: "", eyebrow: "", kind: "activity", emptyTitle: "No transactions yet", emptyText: "TAKE, MOVE, RETURN, damage, maintenance, and correction events will appear here after workspace data is connected." }} /></article>
      <article className="workspace-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">NEEDS ATTENTION</p><h2>Resolve exceptions before dispatch.</h2></div><Link href="/app/damage">Review damage <IconArrowRight size={15} aria-hidden="true" /></Link></div><WorkspaceEmptyState view={{ key: "damage", title: "Damage", summary: "", eyebrow: "", kind: "activity", emptyTitle: "No open exceptions", emptyText: "Damage and maintenance items will be shown here when authenticated records are available." }} /></article>
    </section>
    <section className="workspace-onboarding"><div><p className="workspace-eyebrow">FIRST WORKSPACE SETUP</p><h2>Start with one tool and one clear handoff.</h2><p>The secure setup flow will guide you from company creation to your first QR-labelled tool.</p></div><ActionLink action={{ label: "Open tools", href: "/app/tools" }} /></section>
  </>;
}

function TableContent({ view, tools, locations, workers }: { view: WorkspaceView; tools: ToolSummary[] | null; locations: LocationSummary[] | null; workers: WorkerSummary[] | null }) {
  return <section className="workspace-panel workspace-table-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">{view.eyebrow}</p><h2>{view.title}</h2></div></div><div className="workspace-table-wrap"><table><thead><tr>{(view.columns ?? []).map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{view.key === "tools" && tools?.length ? tools.map((tool) => <tr key={tool.id}><td>{tool.name}</td><td>{tool.asset_code}</td><td>{tool.status.replaceAll("_", " ")}</td><td>{tool.updated_at.slice(0, 10)}</td></tr>) : view.key === "locations" && locations?.length ? locations.map((location) => <tr key={location.id}><td>{location.name}</td><td>{location.type.replaceAll("_", " ")}</td><td>{location.address || "—"}</td><td>{location.active ? "Active" : "Inactive"}</td><td>{location.updated_at.slice(0, 10)}</td></tr>) : view.key === "workers" && workers?.length ? workers.map((worker) => <tr key={worker.id}><td>{worker.name}</td><td>{worker.employee_code || "—"}</td><td>{worker.status}</td><td>{worker.updated_at.slice(0, 10)}</td></tr>) : <tr><td colSpan={view.columns?.length ?? 1}><WorkspaceEmptyState view={view} /></td></tr>}</tbody></table></div></section>;
}

function ActivityContent({ view }: { view: WorkspaceView }) {
  return <section className="workspace-panel workspace-table-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">{view.eyebrow}</p><h2>Durable movement history</h2></div><ActionLink action={view.secondaryAction} quiet /></div><div className="activity-filter-row"><span>All event types</span><span>All locations</span><span>All dates</span></div><WorkspaceEmptyState view={view} /></section>;
}

function ImportContent({ view }: { view: WorkspaceView }) {
  return <section className="workspace-import-layout"><article className="workspace-panel workspace-import-card"><div className="workspace-upload-icon"><IconPlus size={24} aria-hidden="true" /></div><p className="workspace-eyebrow">SAFE IMPORT FLOW</p><h2>Bring in the tool list you already have.</h2><p>Production import will validate CSV/XLSX rows, show a preview, and process batches with retry and idempotency controls.</p><ActionLink action={view.primaryAction} /></article><article className="workspace-panel workspace-checklist"><p className="workspace-eyebrow">BEFORE YOU IMPORT</p><h2>Prepare a clean source list.</h2><ol><li><span>01</span>Separate reusable tools from consumable materials.</li><li><span>02</span>Keep one stable identifier for each tool.</li><li><span>03</span>Confirm the workspace and plan before processing.</li></ol><p className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Queue and storage credentials are required for production import.</p></article></section>;
}

function ReportsContent({ view }: { view: WorkspaceView }) {
  return <section className="workspace-report-grid">{["Tool register", "Transaction history", "Maintenance summary", "Damage summary"].map((report) => <article className="workspace-report-card" key={report}><p className="workspace-eyebrow">REPORT</p><h2>{report}</h2><p>Export company-scoped records after secure workspace data is connected.</p><ActionLink action={{ label: "View report", href: "/app/reports" }} quiet /></article>)}<WorkspaceEmptyState view={view} /></section>;
}

function SettingsContent({ view }: { view: WorkspaceView }) {
  return <section className="workspace-settings-grid"><article className="workspace-panel"><p className="workspace-eyebrow">COMPANY PROFILE</p><h2>Workspace identity</h2><p>Company name, default location, and operational preferences will appear here after onboarding.</p><div className="workspace-form-placeholder"><span>Company name</span><strong>Not connected</strong></div><div className="workspace-form-placeholder"><span>Default location</span><strong>Not connected</strong></div></article><article className="workspace-panel"><p className="workspace-eyebrow">ACCESS CONTROL</p><h2>Membership and roles</h2><p>Owner, admin, manager, and field-worker permissions belong to the authenticated company workspace.</p><div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Supabase Auth and RLS are required before access can be managed.</div><ActionLink action={view.secondaryAction} quiet /></article></section>;
}

function BillingContent() {
  return <section className="workspace-billing"><article className="workspace-panel workspace-plan-card"><p className="workspace-eyebrow">CURRENT PLAN</p><h2>Plan not connected</h2><p>Plan, billing interval, tool capacity, admin capacity, and storage usage will be read from the verified billing state.</p><div className="workspace-plan-line"><span>Active tools</span><strong>—</strong></div><div className="workspace-plan-line"><span>Storage</span><strong>—</strong></div><div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Payment setup is deferred. Billing actions are not available.</div></article><article className="workspace-panel"><p className="workspace-eyebrow">PLAN OPTIONS</p><h2>Choose capacity by tools, not people.</h2><p>Every planned tier keeps field workers unlimited. Upgrade and downgrade rules must be enforced server-side.</p><Link className="workspace-button workspace-button-quiet" href="/pricing">Review public pricing <IconArrowRight size={16} aria-hidden="true" /></Link></article></section>;
}

function PrivacyContent() {
  return <section className="workspace-privacy"><article className="workspace-panel"><p className="workspace-eyebrow">DATA RIGHTS</p><h2>Export or delete workspace data.</h2><p>Privacy requests will be processed only after authenticated ownership, company scope, storage cleanup, and audit logging are connected.</p><div className="workspace-action-row"><button className="workspace-button workspace-button-quiet" type="button" disabled>Request export</button><button className="workspace-button workspace-button-danger" type="button" disabled>Request deletion</button></div><div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Privacy processing is not enabled until the secure data services are configured.</div></article></section>;
}

export function WorkspaceShell({ path, view, tools = null, locations = null, workers = null, dashboardStats = null }: { path: string; view: WorkspaceView; tools?: ToolSummary[] | null; locations?: LocationSummary[] | null; workers?: WorkerSummary[] | null; dashboardStats?: DashboardStats | null }) {
  const toolRegisterConnected = view.key === "tools" && tools !== null;
  const registerConnected = toolRegisterConnected || (view.key === "locations" && locations !== null) || (view.key === "workers" && workers !== null) || (view.key === "dashboard" && dashboardStats !== null);
  return <main className="workspace-shell"><aside className="workspace-sidebar"><Link className="workspace-brand" href="/"><strong>TakeMoveReturn</strong><span>Construction tool tracking</span></Link><nav aria-label="Workspace navigation"><p className="workspace-nav-label">WORKSPACE</p>{navigation.map((item) => <Link className={isActive(path, item.href) ? "workspace-nav-link active" : "workspace-nav-link"} href={item.href} key={item.key}>{item.label}</Link>)}<p className="workspace-nav-label workspace-nav-label-settings">ACCOUNT</p>{settingsNavigation.map((item) => <Link className={isActive(path, item.href) ? "workspace-nav-link active" : "workspace-nav-link"} href={item.href} key={item.key}>{item.label}</Link>)}</nav><div className="workspace-sidebar-footer"><IconLock size={16} aria-hidden="true" /><span>{registerConnected ? "Company register connected" : "Secure workspace connection required"}</span></div></aside><section className="workspace-main"><header className="workspace-topbar"><div><p className="workspace-topbar-label">WORKSPACE / {view.eyebrow}</p><h1>{view.title}</h1></div><div className="workspace-user-state"><span className="workspace-status-dot" />{registerConnected ? "Connected" : "Not connected"}</div></header><div className="workspace-content"><div className="workspace-page-intro"><div><p>{view.summary}</p></div><div className="workspace-heading-actions"><ActionLink action={view.secondaryAction} quiet /><ActionLink action={view.primaryAction} /></div></div>{!registerConnected && <div className="workspace-connection-banner"><IconLock size={18} aria-hidden="true" /><div><strong>Secure workspace data is not connected.</strong><span>This preview shows the intended workflow without inventing company records or metrics.</span></div><Link href="/help/contact">Need help? <IconArrowRight size={15} aria-hidden="true" /></Link></div>}{view.kind === "dashboard" && <DashboardContent stats={dashboardStats} />}{view.kind === "table" && <TableContent view={view} tools={tools} locations={locations} workers={workers} />}{view.kind === "activity" && <ActivityContent view={view} />}{view.kind === "import" && <ImportContent view={view} />}{view.kind === "reports" && <ReportsContent view={view} />}{view.kind === "settings" && <SettingsContent view={view} />}{view.kind === "billing" && <BillingContent />}{view.kind === "privacy" && <PrivacyContent />}</div></section></main>;
}
