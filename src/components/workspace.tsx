import Link from "next/link";
import { IconArrowRight, IconLock, IconRefresh, IconSearch } from "@tabler/icons-react";
import { submitPrivacyRequest } from "../app/app/settings/privacy/actions";
import { inviteWorkspaceMember, revokeWorkspaceInvitation, setWorkspaceMemberStatus, updateCompanySettings, updateWorkspaceMemberRole } from "../app/app/settings/actions";
import { ImportPreview } from "./import-preview";
import { plans } from "../config/plans";

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

export type ToolSummary = { id: string; name: string; asset_code: string; status: string; updated_at: string; expected_return_at?: string | null; holder_name?: string | null; location_name?: string | null };
export type OverdueTool = { id: string; name: string; asset_code: string; expected_return_at: string };
export type LocationSummary = { id: string; name: string; type: string; address: string | null; active: boolean; updated_at: string };
export type WorkerSummary = { id: string; name: string; employee_code: string | null; status: string; updated_at: string };
export type DashboardStats = { totalTools: number; checkedOut: number; needsAttention: number; recentActivity: number; plan: "free" | "starter" | "growth" | "pro"; admins: number; storageBytes: number | null; setupAvailable: boolean; activeLocations: number; activeWorkers: number; firstFieldTake: boolean; firstFieldReturn: boolean; activationStartedAt: string | null; firstScanAt: string | null };
export type CompanySettings = { name: string; plan: "free" | "starter" | "growth" | "pro"; timezone: string; role: string };
export type WorkspaceMember = { user_id: string; email: string; role: "owner" | "admin" | "manager"; status: string; created_at: string };
export type WorkspaceInvitation = { id: string; email: string; role: "admin" | "manager"; status: string; expires_at: string; created_at: string };
export type BillingPlanChange = { plan: "starter" | "growth" | "pro"; billingInterval: "month" | "year"; timing: "immediate" | "next_period"; status: string };
export type BillingState = { plan: "free" | "starter" | "growth" | "pro"; subscriptionPlan: "starter" | "growth" | "pro" | null; role: string; status: string | null; billingInterval: string | null; periodEnd: string | null; enabled: boolean; activeTools: number; admins: number; storageBytes: number | null; pendingPlanChange: BillingPlanChange | null };
export type ActivityRecord = { id: string; toolId: string; toolName: string; assetCode: string; type: string; notes: string | null; createdAt: string };
export type PrivacyRequest = { id: string; request_type: string; status: string; created_at: string; completed_at: string | null; response_summary: string | null };
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

function DashboardContent({ stats, activity, attentionTools, overdueTools, overdueCount }: { stats: DashboardStats | null; activity: ActivityRecord[] | null; attentionTools: ToolSummary[] | null; overdueTools: OverdueTool[] | null; overdueCount: number }) {
  const dashboardPlan = stats ? plans[stats.plan] : null;
  const accountOverLimit = Boolean(stats && dashboardPlan && (
    stats.totalTools > dashboardPlan.toolLimit ||
    stats.admins > dashboardPlan.adminLimit ||
    (stats.storageBytes !== null && stats.storageBytes > dashboardPlan.storageLimitBytes)
  ));
  const cards = [
    { label: "Active tools", value: stats?.totalTools, note: "Excludes retired tools" },
    { label: "Checked out", value: stats?.checkedOut, note: "Currently with workers" },
    { label: "Needs attention", value: stats?.needsAttention, note: "Damaged, missing, or in maintenance" },
    { label: "Recent activity", value: stats?.recentActivity, note: "Events in the last 7 days" },
  ];
  return <>
    {stats?.setupAvailable && !(stats.firstFieldTake && stats.firstFieldReturn) && <section className="workspace-onboarding" aria-label="Setup progress"><div><p className="workspace-eyebrow">GET YOUR CREW TRACKING TOOLS</p><h2>From first tool to first field handoff.</h2><p>{1 + Number(stats.totalTools > 0) + Number(stats.activeLocations > 0) + Number(stats.activeWorkers > 0) + Number(stats.firstFieldTake) + Number(stats.firstFieldReturn)} of 6 verified steps complete</p><progress value={1 + Number(stats.totalTools > 0) + Number(stats.activeLocations > 0) + Number(stats.activeWorkers > 0) + Number(stats.firstFieldTake) + Number(stats.firstFieldReturn)} max={6} aria-label="Setup progress" /><ol><li>Company created</li><li>{stats.totalTools > 0 ? `${stats.totalTools} tool${stats.totalTools === 1 ? "" : "s"} added` : "Add or import your first tools"}</li><li>{stats.activeLocations > 0 ? `${stats.activeLocations} active location${stats.activeLocations === 1 ? "" : "s"} added` : "Add an active location before the first TAKE"}</li><li>{stats.activeWorkers > 0 ? `${stats.activeWorkers} active worker${stats.activeWorkers === 1 ? "" : "s"} added` : "Add a field worker"}</li><li>{stats.firstFieldTake ? "First field TAKE recorded" : "Print a QR label, enroll a device, and record a field TAKE"}</li><li>{stats.firstFieldReturn ? "First field RETURN recorded" : "Record the first field RETURN"}</li></ol><p>Printing a label is separate; progress counts only verified records and worker actions.</p>{stats.totalTools > 0 && stats.activeLocations > 0 && stats.activeWorkers > 0 && !stats.firstFieldTake && <p><Link href="/app/tools/labels">Print QR labels</Link> · <Link href="/field/enroll">Enroll a shared device</Link></p>}</div><ActionLink action={{ label: "Continue setup", href: stats.totalTools === 0 ? "/app/tools/new" : stats.activeLocations === 0 ? "/app/locations/new" : stats.activeWorkers === 0 ? "/app/workers/new" : stats.firstFieldTake ? "/field" : "/app/tools/labels" }} /></section>}
    {accountOverLimit && <section className="workspace-over-limit" role="alert"><div><strong>Your workspace is above the limits of the {dashboardPlan?.name} plan.</strong><span>Existing tools, history and core tracking remain available. Reduce usage where possible or review a larger plan before adding more capacity.</span></div><div className="workspace-over-limit-usage"><span className={stats && dashboardPlan && stats.totalTools > dashboardPlan.toolLimit ? "over" : ""}>Tools: {stats?.totalTools ?? 0} / {dashboardPlan?.toolLimit ?? "—"}</span><span className={stats && dashboardPlan && stats.admins > dashboardPlan.adminLimit ? "over" : ""}>Admins: {stats?.admins ?? 0} / {dashboardPlan?.adminLimit ?? "—"}</span></div><div className="workspace-action-row"><Link className="workspace-button workspace-button-quiet" href="/app/tools">Manage usage</Link><Link className="workspace-button" href="/app/settings/billing">Review plan</Link></div></section>}
    <section className="workspace-stat-grid" aria-label="Workspace overview">
      {cards.map((card) => <article className="workspace-stat" key={card.label}><span>{card.label}</span><strong>{card.value ?? "—"}</strong><small>{stats ? card.note : "Awaiting workspace data"}</small></article>)}
    </section>
    {stats?.activationStartedAt && <section className="workspace-panel" aria-label="First authenticated scan"><p className="workspace-eyebrow">FIELD ACTIVATION</p><h2>First authenticated QR open</h2>{stats.firstScanAt ? <p>Recorded {stats.firstScanAt.slice(0, 16).replace("T", " ")} UTC · {Math.max(0, Math.round((Date.parse(stats.firstScanAt) - Date.parse(stats.activationStartedAt)) / 60000))} minutes after measurement began.</p> : <p>Not recorded yet. Opening a tool QR while signed in as a field worker starts this measurement; anonymous views do not count.</p>}<p>Measurement began {stats.activationStartedAt.slice(0, 10)} UTC. Existing workspaces start from this feature&apos;s activation, not their original sign-up date.</p></section>}
    {overdueTools !== null && <section className="workspace-panel" aria-label="Overdue returns"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">RETURN FOLLOW-UP</p><h2>Overdue returns · {overdueCount.toLocaleString("en-US")}</h2></div>{overdueCount > 0 && <Link href="/app/tools?overdue=1">View all <IconArrowRight size={15} aria-hidden="true" /></Link>}</div>{overdueTools.length ? <><p>These checked-out tools passed their expected return date. Showing the first {overdueTools.length} of {overdueCount}. Review each record and follow up with the holder. No email or SMS is sent automatically.</p><ul className="workspace-dashboard-list">{overdueTools.map((tool) => <li key={tool.id}><Link href={`/app/tools/${tool.id}`}>{tool.name} · {tool.asset_code}</Link><span>Due {tool.expected_return_at.slice(0, 10)} UTC</span></li>)}</ul></> : <p>No checked-out tools are overdue.</p>}</section>}
    <section className="workspace-panel-grid">
      <article className="workspace-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">RECENT ACTIVITY</p><h2>Keep every handoff visible.</h2></div><Link href="/app/activity">View activity <IconArrowRight size={15} aria-hidden="true" /></Link></div>{activity?.length ? <ul className="workspace-dashboard-list">{activity.map((event) => <li key={event.id}><Link href={`/app/tools/${event.toolId}`}>{event.toolName}</Link><span>{event.type.toUpperCase()} · {event.createdAt.slice(0, 10)}</span></li>)}</ul> : <WorkspaceEmptyState view={{ key: "activity", title: "Activity", summary: "", eyebrow: "", kind: "activity", emptyTitle: "No transactions yet", emptyText: "A tool movement will appear here once it has been recorded." }} />}</article>
      <article className="workspace-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">NEEDS ATTENTION</p><h2>Resolve exceptions before dispatch.</h2></div><Link href="/app/tools">Review tools <IconArrowRight size={15} aria-hidden="true" /></Link></div>{attentionTools?.length ? <ul className="workspace-dashboard-list">{attentionTools.map((tool) => <li key={tool.id}><Link href={`/app/tools/${tool.id}`}>{tool.name} · {tool.asset_code}</Link><span>{tool.status.replaceAll("_", " ")}</span></li>)}</ul> : <WorkspaceEmptyState view={{ key: "attention", title: "Attention", summary: "", eyebrow: "", kind: "activity", emptyTitle: "No tools need attention", emptyText: "Damaged, missing, and maintenance-status tools will appear here." }} />}</article>
    </section>
  </>;
}

function RecordPages({ path, page, pageCount, recordCount, overdueOnly = false }: { path: string; page: number; pageCount: number; recordCount: number; overdueOnly?: boolean }) {
  const href = (target: number) => `${path}?${overdueOnly ? "overdue=1&" : ""}page=${target}`;
  return <nav className="workspace-record-pages" aria-label={`${path.split("/").at(-1)} pages`}>
    <span>{recordCount.toLocaleString("en-US")} {recordCount === 1 ? "record" : "records"} · page {page} of {pageCount}</span>
    <div>{page > 1 && <Link href={href(page - 1)}>Previous</Link>}{page < pageCount && <Link href={href(page + 1)}>Next</Link>}</div>
  </nav>;
}

function TableContent({ view, tools, locations, workers, path, page, pageCount, recordCount, overdueOnly }: { view: WorkspaceView; tools: ToolSummary[] | null; locations: LocationSummary[] | null; workers: WorkerSummary[] | null; path: string; page: number; pageCount: number; recordCount: number; overdueOnly: boolean }) {
  return <section className="workspace-panel workspace-table-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">{view.eyebrow}</p><h2>{view.title}</h2></div>{overdueOnly && <Link href="/app/tools">All tools</Link>}</div><div className="workspace-table-wrap"><table><thead><tr>{(view.columns ?? []).map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{view.key === "tools" && tools?.length ? tools.map((tool) => <tr key={tool.id}><td><Link href={`/app/tools/${tool.id}`}>{tool.name}</Link> · <Link href={`/app/tools/${tool.id}/label`}>QR label</Link></td><td>{tool.asset_code}</td><td>{tool.status.replaceAll("_", " ")}</td><td>{tool.holder_name || "—"}</td><td>{tool.location_name || "—"}</td><td>{overdueOnly ? tool.expected_return_at?.slice(0, 10) ?? "—" : tool.updated_at.slice(0, 10)}</td></tr>) : view.key === "locations" && locations?.length ? locations.map((location) => <tr key={location.id}><td><Link href={`/app/locations/${location.id}`}>{location.name}</Link></td><td>{location.type.replaceAll("_", " ")}</td><td>{location.address || "—"}</td><td>{location.active ? "Active" : "Inactive"}</td><td>{location.updated_at.slice(0, 10)}</td></tr>) : view.key === "workers" && workers?.length ? workers.map((worker) => <tr key={worker.id}><td><Link href={`/app/workers/${worker.id}`}>{worker.name}</Link></td><td>{worker.employee_code || "—"}</td><td>{worker.status}</td><td><Link href={`/app/workers/${worker.id}/security`}>Reset PIN</Link> · <Link href={`/app/workers/${worker.id}/deactivate`}>Deactivate</Link></td></tr>) : <tr><td colSpan={view.columns?.length ?? 1}><WorkspaceEmptyState view={view} /></td></tr>}</tbody></table></div><RecordPages path={path} page={page} pageCount={pageCount} recordCount={recordCount} overdueOnly={overdueOnly} /></section>;
}

function ActivityContent({ view, activity, path, page, pageCount, recordCount }: { view: WorkspaceView; activity: ActivityRecord[] | null; path: string; page: number; pageCount: number; recordCount: number }) {
  return <section className="workspace-panel workspace-table-panel"><div className="workspace-panel-heading"><div><p className="workspace-eyebrow">{view.eyebrow}</p><h2>Durable movement history</h2></div><ActionLink action={view.secondaryAction} quiet /></div>{activity?.length ? <div className="workspace-table-wrap"><table><thead><tr><th>When (UTC)</th><th>Tool</th><th>Action</th><th>Note</th></tr></thead><tbody>{activity.map((event) => <tr key={event.id}><td>{event.createdAt.slice(0, 16).replace("T", " ")}</td><td><Link href={`/app/tools/${event.toolId}`}>{event.toolName} · {event.assetCode}</Link></td><td>{event.type.toUpperCase()}</td><td>{event.notes || "—"}</td></tr>)}</tbody></table></div> : <WorkspaceEmptyState view={view} />}<RecordPages path={path} page={page} pageCount={pageCount} recordCount={recordCount} /></section>;
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

function SettingsContent({ view, company, members, invitations, notice }: { view: WorkspaceView; company: CompanySettings | null; members: WorkspaceMember[] | null; invitations: WorkspaceInvitation[] | null; notice: string | null }) {
  const canEdit = Boolean(company && ["owner", "admin"].includes(company.role));
  const isOwner = company?.role === "owner";
  const plan = company ? plans[company.plan] : null;
  const activeMembers = members?.filter((member) => member.status === "active") ?? [];
  const pendingInvites = invitations?.filter((invite) => invite.status === "pending") ?? [];
  const reservedSeats = activeMembers.length + pendingInvites.length;
  const atLimit = Boolean(plan && reservedSeats >= plan.adminLimit);

  const memberNotice = notice?.startsWith("invite-") || notice?.startsWith("member-") || notice?.startsWith("members-")
    ? notice === "invite-sent" ? "Invitation created and the provider accepted the invitation email request."
      : notice === "invite-created" ? "Invitation created. If email delivery is unavailable or the person already has an account, share the sign-in link shown below."
      : notice === "invite-revoked" ? "Invitation revoked."
      : notice === "invite-limit" || notice === "member-limit" ? "This workspace is at its administrator limit. Deactivate a management member or upgrade the plan before adding another."
      : notice === "invite-member" ? "That email already belongs to an active member of this workspace."
      : notice === "invite-workspace" ? "That account already belongs to another active workspace. Multi-workspace switching is not enabled yet, so it cannot be invited here."
      : notice === "invite-pending" ? "An active invitation already exists for that email."
      : notice === "invite-invalid" || notice === "member-invalid" ? "Check the member details and try again."
      : notice === "member-updated" ? "Member role updated."
      : notice === "member-deactivated" ? "Member access deactivated. Historical activity remains intact."
      : notice === "member-reactivated" ? "Member access reactivated."
      : notice === "members-forbidden" ? "Only the workspace owner can change membership."
      : "Membership could not be updated. Please try again."
    : null;

  return <section className="workspace-settings-grid">
    <article className="workspace-panel">
      <p className="workspace-eyebrow">COMPANY PROFILE</p><h2>Workspace identity</h2>
      <p>Owners and admins can update the display name and timezone. This does not change your plan or membership roles.</p>
      {notice?.startsWith("settings-") && <p className="workspace-connection-banner" role={notice === "settings-saved" ? "status" : "alert"}>{notice === "settings-saved" ? "Workspace settings saved." : notice === "settings-invalid" ? "Enter a name of 2–120 characters and a valid IANA timezone." : notice === "settings-forbidden" ? "Only owners and admins can change workspace settings." : "Settings could not be saved. Please try again."}</p>}
      {canEdit ? <form action={updateCompanySettings}><label htmlFor="company-name">Company name</label><input id="company-name" name="name" required minLength={2} maxLength={120} defaultValue={company!.name} /><label htmlFor="company-timezone">Timezone</label><input id="company-timezone" name="timezone" required maxLength={64} list="company-timezones" defaultValue={company!.timezone} /><datalist id="company-timezones"><option value="UTC" /><option value="America/New_York" /><option value="America/Chicago" /><option value="America/Denver" /><option value="America/Los_Angeles" /><option value="Asia/Shanghai" /><option value="Europe/London" /><option value="Australia/Sydney" /></datalist><button className="workspace-button" type="submit">Save settings</button></form> : <><div className="workspace-form-placeholder"><span>Company name</span><strong>{company?.name ?? "Not connected"}</strong></div><div className="workspace-form-placeholder"><span>Timezone</span><strong>{company?.timezone ?? "—"}</strong></div></>}
      <div className="workspace-form-placeholder"><span>Plan</span><strong>{company?.plan ?? "—"}</strong></div>
    </article>

    <article className="workspace-panel workspace-members-panel">
      <p className="workspace-eyebrow">ACCESS CONTROL</p><h2>Membership and roles</h2>
      <p>Management accounts consume the administrator capacity of the plan. Field workers are separate and remain unlimited.</p>
      <div className="workspace-form-placeholder"><span>Your role</span><strong>{company?.role ?? "Not connected"}</strong></div>
      <div className="workspace-form-placeholder"><span>Administrator capacity</span><strong>{plan && members !== null ? `${activeMembers.length} active · ${pendingInvites.length} invited / ${plan.adminLimit}` : plan ? `Up to ${plan.adminLimit}` : "—"}</strong></div>
      {memberNotice && <p className="workspace-connection-banner" role={memberNotice.includes("created") || memberNotice.includes("updated") || memberNotice.includes("reactivated") || memberNotice.includes("deactivated") || memberNotice.includes("revoked") ? "status" : "alert"}>{memberNotice}</p>}

      {isOwner && <section className="workspace-member-invite">
        <h3>Invite management user</h3>
        <p>Admin and manager accounts both count toward the plan limit. Pending invitations reserve a seat so concurrent invites cannot oversubscribe the plan.</p>
        {atLimit ? <div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Administrator capacity is full. Deactivate a member, revoke a pending invitation, or upgrade the plan.</div>
        : <form action={inviteWorkspaceMember}>
          <div><label htmlFor="invite-email">Work email</label><input id="invite-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="manager@company.com" /></div>
          <div><label htmlFor="invite-role">Role</label><select id="invite-role" name="role" defaultValue="manager"><option value="manager">Manager</option><option value="admin">Admin</option></select></div>
          <button className="workspace-button" type="submit">Create invitation</button>
        </form>}
        <p className="workspace-plan-note">Existing users can sign in at <Link href="/auth/login?next=invitation">the invitation sign-in page</Link>. New users receive a Supabase invitation email when provider delivery is available.</p>
      </section>}

      {members !== null ? <section className="workspace-member-list"><h3>Members</h3>{members.map((member) => <article key={member.user_id} className="workspace-member-row">
        <div><strong>{member.email || "Email unavailable"}</strong><span>{member.role} · {member.status}</span></div>
        {isOwner && member.role !== "owner" ? <div className="workspace-member-actions">
          <form action={updateWorkspaceMemberRole}><input type="hidden" name="user_id" value={member.user_id} /><select name="role" defaultValue={member.role} aria-label={`Role for ${member.email}`}><option value="manager">Manager</option><option value="admin">Admin</option></select><button className="workspace-button workspace-button-quiet" type="submit">Save role</button></form>
          <form action={setWorkspaceMemberStatus}><input type="hidden" name="user_id" value={member.user_id} /><input type="hidden" name="active" value={member.status === "active" ? "false" : "true"} /><button className="workspace-button workspace-button-quiet" type="submit">{member.status === "active" ? "Deactivate" : "Reactivate"}</button></form>
        </div> : <span className="workspace-member-fixed">{member.role === "owner" ? "Owner access is protected" : "View only"}</span>}
      </article>)}</section> : <div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Member details are available to owners and admins.</div>}

      {isOwner && invitations !== null && <section className="workspace-member-list"><h3>Pending invitations</h3>{pendingInvites.length ? pendingInvites.map((invite) => <article key={invite.id} className="workspace-member-row">
        <div><strong>{invite.email}</strong><span>{invite.role} · expires {invite.expires_at.slice(0, 10)}</span></div>
        <form action={revokeWorkspaceInvitation}><input type="hidden" name="invitation_id" value={invite.id} /><button className="workspace-button workspace-button-quiet" type="submit">Revoke</button></form>
      </article>) : <p>No pending invitations.</p>}</section>}
      <ActionLink action={view.secondaryAction} quiet />
    </article>
  </section>;
}

function BillingContent({ billing, notice }: { billing: BillingState | null; notice: string | null }) {
  const current = billing ? plans[billing.plan] : null;
  const overTools = Boolean(billing && current && billing.activeTools > current.toolLimit);
  const overAdmins = Boolean(billing && current && billing.admins > current.adminLimit);
  const overStorage = Boolean(billing && current && billing.storageBytes !== null && billing.storageBytes > current.storageLimitBytes);
  const overLimit = overTools || overAdmins || overStorage;
  const billingMismatch = Boolean(billing?.subscriptionPlan && billing.status !== "canceled" && billing.subscriptionPlan !== billing.plan);
  const storageUsage = billing?.storageBytes == null ? "Temporarily unavailable" : billing.storageBytes < 1024 ** 2 ? `${Math.round(billing.storageBytes / 1024)} KB` : `${(billing.storageBytes / (1024 ** 2)).toFixed(1)} MB`;
  const pendingChange = billing?.pendingPlanChange ?? null;
  const paidOwner = Boolean(billing && billing.role === "owner" && billing.plan !== "free");
  const fileStorageActive = process.env.CUSTOMER_FILES_ENABLED === "true";
  const storageRatio = billing?.storageBytes != null && current && current.storageLimitBytes > 0 ? billing.storageBytes / current.storageLimitBytes : 0;
  const storageWarning = fileStorageActive && storageRatio >= 0.8 && storageRatio <= 1;

  const noticeText = notice === "payment-pending"
    ? "Checkout returned successfully. Subscription activation is pending a valid signed Waffo event."
    : notice === "plan-change-pending"
      ? "Plan change was submitted to Waffo. Your current entitlement stays authoritative until the signed plan-change event arrives."
      : notice === "cancel-pending"
        ? "Cancellation was requested. The Billing status and current period end will update only after Waffo confirms it."
        : notice === "reactivation-pending"
          ? "Reactivation was requested. The subscription remains canceling until Waffo confirms the change."
          : notice === "already-canceling"
            ? "This subscription is already scheduled to cancel. You can reactivate it before the period ends."
            : notice === "checkout-terms"
              ? "Please accept the current Terms and Privacy Policy before checkout."
              : notice === "checkout-subscribed"
                ? "This workspace already has a paid subscription. Review your current plan before requesting another change."
                : notice === "checkout-in-progress"
                  ? "A checkout is already in progress. Please wait up to 45 minutes before trying again, or contact billing@takemovereturn.com."
                  : notice === "checkout-temporary"
                    ? "Checkout could not be started right now. Please try again later or contact billing@takemovereturn.com."
                    : null;

  return <>
    <section className="workspace-billing-notices">
      {noticeText && <p className="workspace-connection-banner" role={notice?.startsWith("checkout-") ? "alert" : "status"}><span>{noticeText}{!notice?.startsWith("checkout-") && " If the status does not update, contact billing@takemovereturn.com with the order reference."}</span></p>}
      {pendingChange && <p className="workspace-connection-banner" role="status"><span>
        {pendingChange.status === "scheduled" ? "Scheduled change" : "Plan change pending"}: {plans[pendingChange.plan].name} · {pendingChange.billingInterval === "year" ? "annual" : "monthly"}.
        {pendingChange.timing === "immediate" ? " Waffo will apply it after confirmation." : " It is set for the next billing period."}
      </span></p>}
      {billing?.status === "past_due" && <p className="workspace-connection-banner" role="alert"><span>Payment is past due. Existing data remains available. Resolve billing through Waffo or contact billing@takemovereturn.com; plan changes are paused until the subscription returns to active.</span></p>}
      {billingMismatch && <p className="workspace-connection-banner" role="alert"><span>Billing records need review: the subscription plan does not match the workspace entitlement. Core data remains available; contact billing@takemovereturn.com before making another purchase.</span></p>}
      {overLimit && <div className="workspace-over-limit" role="alert"><div><strong>Your workspace is above one or more limits of the current plan.</strong><span>Existing records remain available. New additions that exceed an enforced limit are restricted until usage is reduced or the plan is upgraded.</span></div><div className="workspace-over-limit-usage"><span className={overTools ? "over" : ""}>Tools: {billing?.activeTools ?? 0} / {current?.toolLimit ?? "—"}</span><span className={overAdmins ? "over" : ""}>Admins: {billing?.admins ?? 0} / {current?.adminLimit ?? "—"}</span><span className={overStorage ? "over" : ""}>Storage: {storageUsage} / {current ? current.id === "free" ? `${current.storageLimitBytes / (1024 ** 2)} MB` : `${current.storageLimitBytes / (1024 ** 3)} GB` : "—"}</span></div><div className="workspace-action-row"><Link className="workspace-button workspace-button-quiet" href="/app/tools">Review tools</Link><Link className="workspace-button" href="/pricing">Review plans</Link></div></div>}
      {storageWarning && <p className="workspace-connection-banner" role="status"><span>Storage is at {Math.floor(storageRatio * 100)}% of the {current?.name} allowance. Delete unused files or review a larger plan before uploads are blocked.</span></p>}
    </section>

    <section className="workspace-billing">
      <article className="workspace-panel workspace-plan-card">
        <p className="workspace-eyebrow">CURRENT PLAN</p>
        <h2>{current ? `${current.name} plan` : "Plan unavailable"}</h2>
        <p>{billing?.status ? `Subscription: ${billing.status.replaceAll("_", " ")}.` : "No paid subscription is connected to this workspace."}</p>
        <div className="workspace-plan-line"><span>Active tools</span><strong>{billing && current ? `${billing.activeTools.toLocaleString("en-US")} / ${current.toolLimit.toLocaleString("en-US")}` : "—"}</strong></div>
        <div className="workspace-plan-line"><span>Administrators</span><strong>{billing && current ? `${billing.admins} / ${current.adminLimit}` : "—"}</strong></div>
        <div className="workspace-plan-line"><span>Storage allowance</span><strong>{billing && current ? `${storageUsage} / ${current.id === "free" ? `${current.storageLimitBytes / (1024 ** 2)} MB` : `${current.storageLimitBytes / (1024 ** 3)} GB`}` : "—"}</strong></div>
        {fileStorageActive ? <p className="workspace-plan-note">Private tool photos, damage photos, and maintenance attachments are enabled and count against this allowance.</p> : <p className="workspace-plan-note">Customer-file uploads are staged but not enabled until the dedicated R2 bucket, database migration, and production verification are complete. Tool records, QR tracking and imports do not depend on file storage.</p>}
        <div className="workspace-plan-line"><span>Billing interval</span><strong>{billing?.billingInterval === "year" ? "Annual" : billing?.billingInterval === "month" ? "Monthly" : "—"}</strong></div>
        {billing?.periodEnd && <div className="workspace-plan-line"><span>Current period ends</span><strong>{billing.periodEnd.slice(0, 10)}</strong></div>}
        {billing?.status === "canceling" && <p>Cancellation is scheduled. Access remains until the current period ends unless Waffo reports otherwise.</p>}
        {!billing?.enabled && <div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Paid billing actions are temporarily unavailable.</div>}

        {billing?.enabled && paidOwner && (billing?.status === "active" || billing?.status === "past_due") && <form className="workspace-billing-danger" method="post" action="/api/billing/cancel">
          <strong>Cancel subscription</strong>
          <p>{billing.status === "past_due" ? "A past-due subscription may stop immediately under the provider's billing state." : "Cancellation is requested for the end of the current billing period. Existing data is not deleted."}</p>
          <button className="workspace-button workspace-button-quiet" type="submit">{billing.status === "past_due" ? "Request cancellation" : "Cancel at period end"}</button>
        </form>}
        {billing?.enabled && paidOwner && billing?.status === "canceling" && <form className="workspace-billing-danger" method="post" action="/api/billing/reactivate">
          <strong>Keep subscription</strong>
          <p>Withdraw the pending cancellation before the subscription ends. Entitlement changes only after Waffo confirms reactivation.</p>
          <button className="workspace-button" type="submit">Reactivate subscription</button>
        </form>}
      </article>

      <article className="workspace-panel workspace-plan-options">
        <p className="workspace-eyebrow">PLAN OPTIONS</p>
        <h2>Choose capacity by tools, not people.</h2>
        <p>Field workers are unlimited on every plan. Prices are charged in USD.</p>

        {billing?.enabled && billing.role === "owner" && billing.plan === "free" ? <div className="workspace-billing-options">{(["starter", "growth", "pro"] as const).map((plan) => <article key={plan} className="workspace-billing-option"><header><h3>{plans[plan].name}</h3><span>{plans[plan].toolLimit.toLocaleString("en-US")} tools</span></header><div className="workspace-billing-prices"><p><strong>${plans[plan].monthlyPrice}</strong><span> / month</span></p><p>${plans[plan].annualPrice} / year <small>Save 2 months</small></p></div><ul><li>{plans[plan].toolLimit.toLocaleString("en-US")} active tools</li><li>{plans[plan].adminLimit} administrators</li><li>Unlimited field workers</li><li>{plans[plan].storageLimitBytes / (1024 ** 3)} GB {fileStorageActive ? "private file storage" : "storage allowance*"}</li></ul><form method="post" action="/api/billing/checkout"><input type="hidden" name="plan" value={plan} /><label htmlFor={`billing-interval-${plan}`}>Billing interval</label><select id={`billing-interval-${plan}`} name="billing_interval" defaultValue="month"><option value="month">Monthly</option><option value="year">Annual · Save 2 months</option></select><button className="workspace-button" type="submit">Upgrade to {plans[plan].name}</button></form></article>)}</div>
        : billing?.enabled && paidOwner ? <div className="workspace-billing-management">
          <h3>Change subscription</h3>
          <p>Upgrades to a higher capacity are submitted as immediate changes. Downgrades and billing-interval switches are submitted for the next billing period. Your current limits stay authoritative until a signed Waffo webhook confirms the change.</p>
          {pendingChange ? <div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />A plan change is already {pendingChange.status === "scheduled" ? "scheduled" : "in progress"}. Wait for it to resolve before starting another.</div>
          : billing.status === "active" ? <form method="post" action="/api/billing/change-plan">
            <div><label htmlFor="target-plan">Target plan</label><select id="target-plan" name="plan" defaultValue={billing.plan}><option value="starter">Starter · 200 tools</option><option value="growth">Growth · 600 tools</option><option value="pro">Pro · 2,000 tools</option></select></div>
            <div><label htmlFor="target-interval">Billing interval</label><select id="target-interval" name="billing_interval" defaultValue={billing.billingInterval === "year" ? "year" : "month"}><option value="month">Monthly</option><option value="year">Annual · Save 2 months</option></select></div>
            <button className="workspace-button" type="submit">Review change with Waffo</button>
          </form>
          : <div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Plan changes require an active subscription. Resolve {billing.status ?? "the current billing state"} first.</div>}
        </div>
        : billing?.plan !== "free" ? <p>Only the workspace owner can manage the paid subscription.</p>
        : <p>Only the workspace owner can start a paid subscription when checkout is open.</p>}

        {fileStorageActive ? <p className="workspace-plan-note">Private customer files are limited by the workspace plan and are served only through authenticated file routes.</p> : <p className="workspace-plan-note">* Customer-file storage code is staged behind a production gate. The existing OpenNext R2 cache is separate and does not count against customer storage.</p>}
        <div className="workspace-pricing-link"><Link className="workspace-button workspace-button-quiet" href="/pricing">Review public pricing <IconArrowRight size={16} aria-hidden="true" /></Link></div>
      </article>
    </section>
  </>;
}

function PrivacyContent({ requests }: { requests: PrivacyRequest[] | null }) {
  return <section className="workspace-privacy"><article className="workspace-panel"><p className="workspace-eyebrow">YOUR ACCOUNT DATA</p><h2>Download or request your data.</h2><p>The instant download includes your account, profile, memberships and actions attributed to you. It does not include the company register or other people&apos;s records.</p>{requests !== null ? <><div className="workspace-action-row"><Link className="workspace-button workspace-button-quiet" href="/api/privacy/export">Download account data</Link></div><form action={submitPrivacyRequest}><label htmlFor="privacy-request-type">Request type</label><select id="privacy-request-type" name="requestType" required defaultValue=""><option value="" disabled>Choose a request</option><option value="access">Access</option><option value="export">More complete export</option><option value="rectification">Correction</option><option value="restriction">Restriction</option><option value="deletion">Account deletion review</option></select><label htmlFor="privacy-request-details">Details (optional)</label><textarea id="privacy-request-details" name="details" maxLength={500} rows={3} /><p>A deletion request is reviewed before any data is removed. It does not immediately delete your account or your company&apos;s history.</p><button className="workspace-button" type="submit">Submit request</button></form><h3>Your recent requests</h3>{requests.length ? <ul>{requests.map((request) => <li key={request.id}>{request.request_type} · {request.status} · {request.created_at.slice(0, 10)}{request.response_summary && <p>{request.response_summary}</p>}</li>)}</ul> : <p>No requests yet.</p>}</> : <div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />Sign-in is required for self-service requests.</div>}</article></section>;
}

export function WorkspaceShell({ path, view, tools = null, locations = null, workers = null, dashboardStats = null, activity = null, attentionTools = null, overdueTools = null, overdueCount = 0, overdueOnly = false, page = 1, pageCount = 1, recordCount = 0, companySettings = null, workspaceMembers = null, workspaceInvitations = null, billing = null, privacyRequests = null, reportAccess = false, reportConnected = false, searchConnected = false, searchQuery = "", searchResults = null, notice = null }: { path: string; view: WorkspaceView; tools?: ToolSummary[] | null; locations?: LocationSummary[] | null; workers?: WorkerSummary[] | null; dashboardStats?: DashboardStats | null; activity?: ActivityRecord[] | null; attentionTools?: ToolSummary[] | null; overdueTools?: OverdueTool[] | null; overdueCount?: number; overdueOnly?: boolean; page?: number; pageCount?: number; recordCount?: number; companySettings?: CompanySettings | null; workspaceMembers?: WorkspaceMember[] | null; workspaceInvitations?: WorkspaceInvitation[] | null; billing?: BillingState | null; privacyRequests?: PrivacyRequest[] | null; reportAccess?: boolean; reportConnected?: boolean; searchConnected?: boolean; searchQuery?: string; searchResults?: SearchResult[] | null; notice?: string | null }) {
  const toolRegisterConnected = view.key === "tools" && tools !== null;
  const registerConnected = toolRegisterConnected || view.key === "import" || (view.key === "search" && searchConnected) || (view.key === "locations" && locations !== null) || (view.key === "workers" && workers !== null) || (view.key === "dashboard" && dashboardStats !== null) || (view.key === "activity" && activity !== null) || (view.key === "settings" && companySettings !== null) || (view.key === "settings/billing" && billing !== null) || (view.key === "reports" && reportConnected) || (view.key === "settings/privacy" && privacyRequests !== null);
  return <main className="workspace-shell"><aside className="workspace-sidebar"><Link className="workspace-brand" href="/"><strong>TakeMoveReturn</strong><span>Construction tool tracking</span></Link><nav aria-label="Workspace navigation"><p className="workspace-nav-label">WORKSPACE</p>{navigation.map((item) => <Link className={isActive(path, item.href) ? "workspace-nav-link active" : "workspace-nav-link"} href={item.href} key={item.key}>{item.label}</Link>)}<p className="workspace-nav-label workspace-nav-label-settings">ACCOUNT</p>{settingsNavigation.map((item) => <Link className={isActive(path, item.href) ? "workspace-nav-link active" : "workspace-nav-link"} href={item.href} key={item.key}>{item.label}</Link>)}</nav><div className="workspace-sidebar-footer"><IconLock size={16} aria-hidden="true" /><span>{registerConnected ? "Company register connected" : "Secure workspace connection required"}</span></div></aside><section className="workspace-main"><header className="workspace-topbar"><div><p className="workspace-topbar-label">WORKSPACE / {view.eyebrow}</p><h1>{view.title}</h1></div><div className="workspace-user-state"><span className="workspace-status-dot" />{registerConnected ? "Connected" : "Not connected"}</div></header><div className="workspace-content">{notice === "invitation-accepted" && <p className="workspace-connection-banner" role="status">Workspace invitation accepted. Your management access is now active.</p>}{notice === "pin-reset" && <p className="workspace-connection-banner" role="status">Worker PIN updated. Previous worker sessions were ended.</p>}{notice?.startsWith("privacy-") && <p className="workspace-connection-banner" role="status">{notice === "privacy-saved" ? "Your request was recorded for review." : notice === "privacy-open" ? "An open request of this type already exists." : "Choose a request type and keep details under 500 characters."}</p>}<div className="workspace-page-intro"><div><p>{view.summary}</p></div><div className="workspace-heading-actions"><ActionLink action={view.secondaryAction} quiet /><ActionLink action={view.primaryAction} /></div></div>{!registerConnected && <div className="workspace-connection-banner"><IconLock size={18} aria-hidden="true" /><div><strong>Secure workspace data is not connected.</strong><span>This preview shows the intended workflow without inventing company records or metrics.</span></div><Link href="/help/contact">Need help? <IconArrowRight size={15} aria-hidden="true" /></Link></div>}{view.kind === "dashboard" && <DashboardContent stats={dashboardStats} activity={activity} attentionTools={attentionTools} overdueTools={overdueTools} overdueCount={overdueCount} />}{view.kind === "search" && <SearchContent query={searchQuery} results={searchResults} />}{view.kind === "table" && <TableContent view={view} tools={tools} locations={locations} workers={workers} path={path} page={page} pageCount={pageCount} recordCount={recordCount} overdueOnly={overdueOnly} />}{view.kind === "activity" && <ActivityContent view={view} activity={activity} path={path} page={page} pageCount={pageCount} recordCount={recordCount} />}{view.kind === "import" && <ImportContent />}{view.kind === "reports" && <ReportsContent ready={reportAccess} />}{view.kind === "settings" && <SettingsContent view={view} company={companySettings} members={workspaceMembers} invitations={workspaceInvitations} notice={notice} />}{view.kind === "billing" && <BillingContent billing={billing} notice={notice} />}{view.kind === "privacy" && <PrivacyContent requests={privacyRequests} />}</div></section></main>;
}
