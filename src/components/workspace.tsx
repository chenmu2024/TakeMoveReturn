import Link from "next/link";
import { IconArrowRight, IconLock, IconRefresh, IconSearch } from "@tabler/icons-react";
import { submitPrivacyRequest } from "../app/app/settings/privacy/actions";
import { updateCompanySettings } from "../app/app/settings/actions";
import { ImportPreview } from "./import-preview";

export type WorkspaceView = {
  key: string;
  title: string;
  summary: string;
  eyebrow: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  kind: "dashboard" | "search" | "table" | "activity" | "import" | "reports" | "settings" | "billing" | "privacy";
  columns?: string[];
  emptyTitle?: string;
  emptyText?: string;
};

export type ToolSummary = { id: string; name: string; asset_code: string; status: string; updated_at: string };
export type LocationSummary = { id: string; name: string; type: string; address: string | null; active: boolean; updated_at: string };
export type WorkerSummary = { id: string; name: string; employee_code: string | null; status: string; updated_at: string };
export type DashboardStats = { totalTools: number; checkedOut: number; needsAttention: number; recentActivity: number };
export type CompanySettings = { name: string; plan: string; timezone: string; role: string };
export type ActivityRecord = { id: string; toolId: string; toolName: string; assetCode: string; type: string; notes: string | null; createdAt: string };
export type PrivacyRequest = { id: string; request_type: string; status: string; created_at: string; completed_at: string | null };
export type SearchResult = { result_type: "tool" | "worker" | "location"; result_id: string; title: string; detail: string };

const navigation = [
  { label: "Dashboard", href: "/app/dashboard", key: "dashboard" },
  { label: "Search", href: "/app/search", key: "search" },
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

function SearchContent({ query, results }: { query: string; results: SearchResult[] | null }) {
  const searched = query.length >= 2 && query.length <= 100;
  return <section className="workspace-panel workspace-search"><form action="/app/search" method="get" role="search"><label htmlFor="workspace-search">Search company records</label><div><input id="workspace-search" name="q" type="search" minLength={2} maxLength={100} defaultValue={query} placeholder="Tool name, asset code, worker, or location" required /><button className="workspace-button" type="submit"><IconSearch size={17} aria-hidden="true" />Search</button></div></form>{query && !searched && <p role="alert">Enter between 2 and 100 characters.</p>}{searched && results && <><p role="status">{results.length ? `${results.length} matching records (up to 10 per type).` : "No matching records in your company."}</p><ul className="workspace-search-results">{results.map((result) => <li key={`${result.result_type}-${result.result_id}`}><span>{result.result_type}</span><Link href={result.result_type === "tool" ? `/app/tools/${result.result_id}` : result.result_type === "location" ? `/app/locations/${result.result_id}` : `/app/workers/${result.result_id}`}>{result.title}<IconArrowRight size={16} aria-hidden="true" /></Link><p>{result.detail}</p></li>)}</ul></>}{!query && <p>Search by tool name, asset code, brand, model, serial number, worker name, employee code, location, address, or notes.</p>}</section>;
}

function DashboardContent({ stats, activity, attentionTools }: { stats: DashboardStats | null; activity: ActivityRecord[] | null; attentionTools: ToolSummary[] | null }) {
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
      <article className="workspace-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">RECENT ACTIVITY</p><h2>Keep every handoff visible.</h2></div><Link href="/app/activity">View activity <IconArrowRight size={15} aria-hidden="true" /></Link></div>{activity?.length ? <ul className="workspace-dashboard-list">{activity.map((event) => <li key={event.id}><Link href={`/app/tools/${event.toolId}`}>{event.toolName}</Link><span>{event.type.toUpperCase()} · {event.createdAt.slice(0, 10)}</span></li>)}</ul> : <WorkspaceEmptyState view={{ key: "activity", title: "Activity", summary: "", eyebrow: "", kind: "activity", emptyTitle: "No transactions yet", emptyText: "A tool movement will appear here once it has been recorded." }} />}</article>
      <article className="workspace-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">NEEDS ATTENTION</p><h2>Resolve exceptions before dispatch.</h2></div><Link href="/app/tools">Review tools <IconArrowRight size={15} aria-hidden="true" /></Link></div>{attentionTools?.length ? <ul className="workspace-dashboard-list">{attentionTools.map((tool) => <li key={tool.id}><Link href={`/app/tools/${tool.id}`}>{tool.name} · {tool.asset_code}</Link><span>{tool.status.replaceAll("_", " ")}</span></li>)}</ul> : <WorkspaceEmptyState view={{ key: "attention", title: "Attention", summary: "", eyebrow: "", kind: "activity", emptyTitle: "No tools need attention", emptyText: "Damaged, missing, and maintenance-status tools will appear here." }} />}</article>
    </section>
    {stats?.totalTools === 0 && <section className="workspace-onboarding"><div><p className="workspace-eyebrow">FIRST WORKSPACE SETUP</p><h2>Start with one tool and one clear handoff.</h2><p>Add a reusable tool to begin your company register.</p></div><ActionLink action={{ label: "Open tools", href: "/app/tools" }} /></section>}
  </>;
}

function TableContent({ view, tools, locations, workers }: { view: WorkspaceView; tools: ToolSummary[] | null; locations: LocationSummary[] | null; workers: WorkerSummary[] | null }) {
  return <section className="workspace-panel workspace-table-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">{view.eyebrow}</p><h2>{view.title}</h2></div></div><div className="workspace-table-wrap"><table><thead><tr>{(view.columns ?? []).map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{view.key === "tools" && tools?.length ? tools.map((tool) => <tr key={tool.id}><td><Link href={`/app/tools/${tool.id}`}>{tool.name}</Link> · <Link href={`/app/tools/${tool.id}/label`}>QR label</Link></td><td>{tool.asset_code}</td><td>{tool.status.replaceAll("_", " ")}</td><td>{tool.updated_at.slice(0, 10)}</td></tr>) : view.key === "locations" && locations?.length ? locations.map((location) => <tr key={location.id}><td><Link href={`/app/locations/${location.id}`}>{location.name}</Link></td><td>{location.type.replaceAll("_", " ")}</td><td>{location.address || "—"}</td><td>{location.active ? "Active" : "Inactive"}</td><td>{location.updated_at.slice(0, 10)}</td></tr>) : view.key === "workers" && workers?.length ? workers.map((worker) => <tr key={worker.id}><td><Link href={`/app/workers/${worker.id}`}>{worker.name}</Link></td><td>{worker.employee_code || "—"}</td><td>{worker.status}</td><td><Link href={`/app/workers/${worker.id}/security`}>Reset PIN</Link> · <Link href={`/app/workers/${worker.id}/deactivate`}>Deactivate</Link></td></tr>) : <tr><td colSpan={view.columns?.length ?? 1}><WorkspaceEmptyState view={view} /></td></tr>}</tbody></table></div></section>;
}

function ActivityContent({ view, activity }: { view: WorkspaceView; activity: ActivityRecord[] | null }) {
  return <section className="workspace-panel workspace-table-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">{view.eyebrow}</p><h2>Durable movement history</h2></div><ActionLink action={view.secondaryAction} quiet /></div>{activity?.length ? <div className="workspace-table-wrap"><table><thead><tr><th>When (UTC)</th><th>Tool</th><th>Action</th><th>Note</th></tr></thead><tbody>{activity.map((event) => <tr key={event.id}><td>{event.createdAt.slice(0, 16).replace("T", " ")}</td><td><Link href={`/app/tools/${event.toolId}`}>{event.toolName} · {event.assetCode}</Link></td><td>{event.type.toUpperCase()}</td><td>{event.notes || "—"}</td></tr>)}</tbody></table></div> : <WorkspaceEmptyState view={view} />}</section>;
}

function ImportContent() {
  return <ImportPreview />;
}

function ReportsContent({ ready }: { ready: boolean }) {
  const reports = [
    { title: "Tool register", kind: "tools" },
    { title: "Worker register", kind: "workers" },
    { title: "Location register", kind: "locations" },
    { title: "Transaction history", kind: "activity" },
    { title: "Damage reports", kind: "damage" },
    { title: "Maintenance schedules", kind: "maintenance" },
    { title: "Service history", kind: "service-history" },
  ];
  return <section className="workspace-report-grid">{reports.map((report) => <article className="workspace-report-card" key={report.kind}><p className="workspace-eyebrow">CSV EXPORT</p><h2>{report.title}</h2><p>{ready ? "Download company-scoped records. Exports over 10,000 rows require support." : "Owner or admin access is required to export company records."}</p><ActionLink action={ready ? { label: "Download CSV", href: `/api/reports/${report.kind}` } : undefined} quiet /></article>)}</section>;
}

function SettingsContent({ view, company, notice }: { view: WorkspaceView; company: CompanySettings | null; notice: string | null }) {
  const canEdit = company && ["owner", "admin"].includes(company.role);
  return <section className="workspace-settings-grid"><article className="workspace-panel"><p className="workspace-eyebrow">COMPANY PROFILE</p><h2>Workspace identity</h2><p>Owners and admins can update the display name and timezone. This does not change your plan or membership roles.</p>{notice?.startsWith("settings-") && <p className="workspace-connection-banner" role={notice === "settings-saved" ? "status" : "alert"}>{notice === "settings-saved" ? "Workspace settings saved." : notice === "settings-invalid" ? "Enter a name of 2–120 characters and a valid IANA timezone." : notice === "settings-forbidden" ? "Only owners and admins can change workspace settings." : "Settings could not be saved. Please try again."}</p>}{canEdit ? <form action={updateCompanySettings}><label htmlFor="company-name">Company name</label><input id="company-name" name="name" required minLength={2} maxLength={120} defaultValue={company.name} /><label htmlFor="company-timezone">Timezone</label><input id="company-timezone" name="timezone" required maxLength={64} list="company-timezones" defaultValue={company.timezone} /><datalist id="company-timezones"><option value="UTC" /><option value="America/New_York" /><option value="America/Chicago" /><option value="America/Denver" /><option value="America/Los_Angeles" /><option value="Asia/Shanghai" /><option value="Europe/London" /><option value="Australia/Sydney" /></datalist><button className="workspace-button" type="submit">Save settings</button></form> : <><div className="workspace-form-placeholder"><span>Company name</span><strong>{company?.name ?? "Not connected"}</strong></div><div className="workspace-form-placeholder"><span>Timezone</span><strong>{company?.timezone ?? "—"}</strong></div></>}<div className="workspace-form-placeholder"><span>Plan</span><strong>{company?.plan ?? "—"}</strong></div></article><article className="workspace-panel"><p className="workspace-eyebrow">ACCESS CONTROL</p><h2>Membership and roles</h2><p>Your current role controls which company records you may manage.</p><div className="workspace-form-placeholder"><span>Your role</span><strong>{company?.role ?? "Not connected"}</strong></div><div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Membership management is not yet available.</div><ActionLink action={view.secondaryAction} quiet /></article></section>;
}

function BillingContent() {
  return <section className="workspace-billing"><article className="workspace-panel workspace-plan-card"><p className="workspace-eyebrow">CURRENT PLAN</p><h2>Plan not connected</h2><p>Plan, billing interval, tool capacity, admin capacity, and storage usage will be read from the verified billing state.</p><div className="workspace-plan-line"><span>Active tools</span><strong>—</strong></div><div className="workspace-plan-line"><span>Storage</span><strong>—</strong></div><div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Waffo subscription setup is under verification. Billing actions are not available.</div></article><article className="workspace-panel"><p className="workspace-eyebrow">PLAN OPTIONS</p><h2>Choose capacity by tools, not people.</h2><p>Every planned tier keeps field workers unlimited. Upgrade and downgrade rules must be enforced server-side.</p><Link className="workspace-button workspace-button-quiet" href="/pricing">Review public pricing <IconArrowRight size={16} aria-hidden="true" /></Link></article></section>;
}

function PrivacyContent({ requests }: { requests: PrivacyRequest[] | null }) {
  return <section className="workspace-privacy"><article className="workspace-panel"><p className="workspace-eyebrow">YOUR ACCOUNT DATA</p><h2>Download or request your data.</h2><p>The instant download includes your account, profile, memberships and actions attributed to you. It does not include the company register or other people&apos;s records.</p>{requests !== null ? <><div className="workspace-action-row"><Link className="workspace-button workspace-button-quiet" href="/api/privacy/export">Download account data</Link></div><form action={submitPrivacyRequest}><label htmlFor="privacy-request-type">Request type</label><select id="privacy-request-type" name="requestType" required defaultValue=""><option value="" disabled>Choose a request</option><option value="access">Access</option><option value="export">More complete export</option><option value="rectification">Correction</option><option value="restriction">Restriction</option><option value="deletion">Account deletion review</option></select><label htmlFor="privacy-request-details">Details (optional)</label><textarea id="privacy-request-details" name="details" maxLength={500} rows={3} /><p>A deletion request is reviewed before any data is removed. It does not immediately delete your account or your company&apos;s history.</p><button className="workspace-button" type="submit">Submit request</button></form><h3>Your recent requests</h3>{requests.length ? <ul>{requests.map((request) => <li key={request.id}>{request.request_type} · {request.status} · {request.created_at.slice(0, 10)}</li>)}</ul> : <p>No requests yet.</p>}</> : <div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Sign-in is required for self-service requests.</div>}</article></section>;
}

export function WorkspaceShell({ path, view, tools = null, locations = null, workers = null, dashboardStats = null, activity = null, attentionTools = null, companySettings = null, privacyRequests = null, reportAccess = false, reportConnected = false, searchConnected = false, searchQuery = "", searchResults = null, notice = null }: { path: string; view: WorkspaceView; tools?: ToolSummary[] | null; locations?: LocationSummary[] | null; workers?: WorkerSummary[] | null; dashboardStats?: DashboardStats | null; activity?: ActivityRecord[] | null; attentionTools?: ToolSummary[] | null; companySettings?: CompanySettings | null; privacyRequests?: PrivacyRequest[] | null; reportAccess?: boolean; reportConnected?: boolean; searchConnected?: boolean; searchQuery?: string; searchResults?: SearchResult[] | null; notice?: string | null }) {
  const toolRegisterConnected = view.key === "tools" && tools !== null;
  const registerConnected = toolRegisterConnected || view.key === "import" || (view.key === "search" && searchConnected) || (view.key === "locations" && locations !== null) || (view.key === "workers" && workers !== null) || (view.key === "dashboard" && dashboardStats !== null) || (view.key === "activity" && activity !== null) || (view.key === "settings" && companySettings !== null) || (view.key === "reports" && reportConnected) || (view.key === "settings/privacy" && privacyRequests !== null);
  return <main className="workspace-shell"><aside className="workspace-sidebar"><Link className="workspace-brand" href="/"><strong>TakeMoveReturn</strong><span>Construction tool tracking</span></Link><nav aria-label="Workspace navigation"><p className="workspace-nav-label">WORKSPACE</p>{navigation.map((item) => <Link className={isActive(path, item.href) ? "workspace-nav-link active" : "workspace-nav-link"} href={item.href} key={item.key}>{item.label}</Link>)}<p className="workspace-nav-label workspace-nav-label-settings">ACCOUNT</p>{settingsNavigation.map((item) => <Link className={isActive(path, item.href) ? "workspace-nav-link active" : "workspace-nav-link"} href={item.href} key={item.key}>{item.label}</Link>)}</nav><div className="workspace-sidebar-footer"><IconLock size={16} aria-hidden="true" /><span>{view.key === "import" ? "Read-only import review" : registerConnected ? "Company register connected" : "Secure workspace connection required"}</span></div></aside><section className="workspace-main"><header className="workspace-topbar"><div><p className="workspace-topbar-label">WORKSPACE / {view.eyebrow}</p><h1>{view.title}</h1></div><div className="workspace-user-state"><span className="workspace-status-dot" />{view.key === "import" ? "Review only" : registerConnected ? "Connected" : "Not connected"}</div></header><div className="workspace-content">{notice === "pin-reset" && <p className="workspace-connection-banner" role="status">Worker PIN updated. Previous worker sessions were ended.</p>}{notice?.startsWith("privacy-") && <p className="workspace-connection-banner" role="status">{notice === "privacy-saved" ? "Your request was recorded for review." : notice === "privacy-open" ? "An open request of this type already exists." : "Choose a request type and keep details under 500 characters."}</p>}<div className="workspace-page-intro"><div><p>{view.summary}</p></div><div className="workspace-heading-actions"><ActionLink action={view.secondaryAction} quiet /><ActionLink action={view.primaryAction} /></div></div>{!registerConnected && <div className="workspace-connection-banner"><IconLock size={18} aria-hidden="true" /><div><strong>Secure workspace data is not connected.</strong><span>This preview shows the intended workflow without inventing company records or metrics.</span></div><Link href="/help/contact">Need help? <IconArrowRight size={15} aria-hidden="true" /></Link></div>}{view.kind === "dashboard" && <DashboardContent stats={dashboardStats} activity={activity} attentionTools={attentionTools} />}{view.kind === "search" && <SearchContent query={searchQuery} results={searchResults} />}{view.kind === "table" && <TableContent view={view} tools={tools} locations={locations} workers={workers} />}{view.kind === "activity" && <ActivityContent view={view} activity={activity} />}{view.kind === "import" && <ImportContent />}{view.kind === "reports" && <ReportsContent ready={reportAccess} />}{view.kind === "settings" && <SettingsContent view={view} company={companySettings} notice={notice} />}{view.kind === "billing" && <BillingContent />}{view.kind === "privacy" && <PrivacyContent requests={privacyRequests} />}</div></section></main>;
}
