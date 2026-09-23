import { notFound } from "next/navigation";

const views: Record<string, { title: string; summary: string; next: string }> = {
  dashboard: { title: "Workspace dashboard", summary: "See total tools, availability, checked-out tools, damage, maintenance, and recent activity.", next: "Connect authenticated company data to activate this dashboard." },
  tools: { title: "Tools", summary: "Manage asset codes, QR labels, holders, locations, conditions, and complete history.", next: "Create the first tool after secure workspace setup." },
  workers: { title: "Field workers", summary: "Manage worker identity, 6-digit PIN security, sessions, and currently held tools.", next: "Add a worker after secure workspace setup." },
  locations: { title: "Locations", summary: "Track warehouses, trucks, job sites, and other working locations.", next: "Add a location after secure workspace setup." },
  activity: { title: "Activity", summary: "Review a durable history of TAKE, MOVE, RETURN, damage, maintenance, and corrections.", next: "Transactions appear after the first tool movement." },
  damage: { title: "Damage reports", summary: "Keep reported damage, repair status, and evidence next to the affected tool.", next: "Damage reporting needs authenticated R2 uploads." },
  maintenance: { title: "Maintenance", summary: "Schedule services, track repair history, costs, due dates, and attachments.", next: "Maintenance records need authenticated company data." },
  import: { title: "Import tools", summary: "Upload CSV or XLSX, map fields, validate rows, and process batches safely.", next: "Import processing needs Supabase and Cloudflare Queue bindings." },
  reports: { title: "Reports", summary: "Export company-scoped tools, workers, locations, transactions, maintenance, and damage records.", next: "Reports become available after authenticated data exists." },
  settings: { title: "Workspace settings", summary: "Manage company profile, membership, storage use, and operational preferences.", next: "Settings require a workspace owner session." },
  "settings/billing": { title: "Billing", summary: "Manage monthly or annual plans, upgrade, downgrade, and account limits.", next: "Billing requires Stripe product IDs and a verified webhook." },
  "settings/privacy": { title: "Privacy", summary: "Request personal-data export, account deletion, and privacy workflow status.", next: "Privacy processing requires authenticated company data." },
};

export default async function WorkspacePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const page = views[(await params).slug.join("/")];
  if (!page) notFound();
  return <main><nav aria-label="Workspace navigation"><a href="/app/dashboard">Dashboard</a><a href="/app/tools">Tools</a><a href="/app/workers">Workers</a><a href="/app/locations">Locations</a><a href="/app/activity">Activity</a></nav><h1>{page.title}</h1><p>{page.summary}</p><section><h2>Workspace setup required</h2><p>{page.next}</p><p><strong>BLOCKED_BY_EXTERNAL_CREDENTIALS:</strong> secure Supabase Auth and database connection have not yet been provisioned.</p></section></main>;
}
