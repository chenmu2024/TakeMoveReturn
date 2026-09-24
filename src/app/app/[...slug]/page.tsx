import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceShell, type WorkspaceView } from "../../../components/workspace";

const views: Record<string, WorkspaceView> = {
  dashboard: { key: "dashboard", title: "Workspace dashboard", summary: "A clear starting point for tool custody, locations, exceptions, and the next handoff.", eyebrow: "DASHBOARD", kind: "dashboard", primaryAction: { label: "Add first tool", href: "/app/tools" } },
  tools: { key: "tools", title: "Tools", summary: "Manage reusable tools, QR labels, holders, locations, conditions, and history.", eyebrow: "TOOLS", kind: "table", columns: ["Tool", "Asset code", "Holder", "Location", "Status", "Last move"], primaryAction: { label: "Add tool", href: "/app/tools" }, secondaryAction: { label: "Import list", href: "/app/import" }, emptyTitle: "No tools connected", emptyText: "Your tool register will appear here after secure workspace onboarding is connected." },
  workers: { key: "workers", title: "Field workers", summary: "Manage worker identity, role, PIN security, sessions, and currently held tools.", eyebrow: "WORKERS", kind: "table", columns: ["Worker", "Role", "Status", "Tools held", "Last active"], primaryAction: { label: "Add worker", href: "/app/workers" }, emptyTitle: "No workers connected", emptyText: "Workers will appear here after an authenticated company workspace is available." },
  locations: { key: "locations", title: "Locations", summary: "Track warehouses, trucks, job sites, and the places where tools are handed off.", eyebrow: "LOCATIONS", kind: "table", columns: ["Location", "Type", "Tools", "Address or note", "Updated"], primaryAction: { label: "Add location", href: "/app/locations" }, emptyTitle: "No locations connected", emptyText: "Locations will appear here after your company workspace is created." },
  activity: { key: "activity", title: "Activity", summary: "Review durable TAKE, MOVE, RETURN, damage, maintenance, and correction events.", eyebrow: "ACTIVITY", kind: "activity", secondaryAction: { label: "Export history", href: "/app/reports" }, emptyTitle: "No transactions yet", emptyText: "Events will appear here after the first authenticated tool movement." },
  damage: { key: "damage", title: "Damage reports", summary: "Keep reported damage, repair status, evidence, and the affected tool together.", eyebrow: "DAMAGE", kind: "table", columns: ["Tool", "Reported by", "Severity", "Status", "Reported"], primaryAction: { label: "Report damage", href: "/app/damage" }, emptyTitle: "No damage reports", emptyText: "Damage reports will appear here after secure tool records and attachments are connected." },
  maintenance: { key: "maintenance", title: "Maintenance", summary: "Schedule service, track repair history, costs, due dates, and attachments.", eyebrow: "MAINTENANCE", kind: "table", columns: ["Tool", "Service", "Due", "Status", "Last service"], primaryAction: { label: "Add maintenance", href: "/app/maintenance" }, emptyTitle: "No maintenance records", emptyText: "Maintenance records will appear here after authenticated company data is connected." },
  import: { key: "import", title: "Import tools", summary: "Plan a safe CSV or XLSX migration with validation, preview, batching, and recovery.", eyebrow: "IMPORT", kind: "import", primaryAction: { label: "Choose source file", href: "/app/import" }, emptyTitle: "No import started", emptyText: "Import processing requires Supabase, R2, Queue, and server-side validation." },
  reports: { key: "reports", title: "Reports", summary: "Prepare company-scoped exports for tools, workers, locations, transactions, maintenance, and damage.", eyebrow: "REPORTS", kind: "reports", emptyTitle: "Reports are not connected", emptyText: "Reports will be generated from authenticated company data, never from sample records." },
  settings: { key: "settings", title: "Workspace settings", summary: "Manage company identity, memberships, storage usage, and operational preferences.", eyebrow: "SETTINGS", kind: "settings", secondaryAction: { label: "Review privacy", href: "/app/settings/privacy" } },
  "settings/billing": { key: "settings/billing", title: "Billing", summary: "Manage monthly or annual capacity plans, upgrades, downgrades, and limits.", eyebrow: "BILLING", kind: "billing" },
  "settings/privacy": { key: "settings/privacy", title: "Privacy", summary: "Request personal-data export, account deletion, and privacy workflow status.", eyebrow: "PRIVACY", kind: "privacy" },
};

export default async function WorkspacePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const path = "/app/" + (await params).slug.join("/");
  const key = path.replace(/^\/app\//, "");
  const view = views[key];
  if (!view) notFound();
  return <WorkspaceShell path={path} view={view} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const key = (await params).slug.join("/");
  const view = views[key];
  if (!view) return { robots: { index: false, follow: false } };
  return { title: `${view.title} | TakeMoveReturn`, description: view.summary, robots: { index: false, follow: false } };
}
