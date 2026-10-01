import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../../lib/supabase/server";
import { updateToolDetails } from "../actions";
import "../tool-detail.css";

export const metadata: Metadata = { title: "Edit Tool | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  invalid: "Check the field lengths and try again.",
  unavailable: "Tool details could not be saved. Please try again.",
};

export default async function EditToolPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
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

  const { data: tool, error } = await supabase.from("tools")
    .select("id,name,asset_code,category,brand,model,serial_number,description,notes")
    .eq("id", id).eq("company_id", membership.company_id).maybeSingle();
  if (error) throw new Error("Tool details could not be loaded.");
  if (!tool) notFound();

  const notice = notices[(await searchParams).notice ?? ""];
  return <main className="tool-detail">
    <header className="tool-detail-header"><Link href={`/app/tools/${id}`}>← Back to tool</Link><span>EDIT TOOL RECORD</span></header>
    <section className="tool-detail-hero"><div><p className="tool-detail-eyebrow">TOOL RECORD · {tool.asset_code}</p><h1>Edit {tool.name}</h1><p>Update descriptive asset information without changing custody or movement history.</p></div></section>
    {notice && <p className="tool-detail-notice" role="alert">{notice}</p>}
    <section className="tool-detail-panel tool-detail-edit">
      <form className="tool-detail-edit-form" action={updateToolDetails}>
        <input type="hidden" name="toolId" value={tool.id} />
        <label htmlFor="tool-edit-name">Tool name</label>
        <input id="tool-edit-name" name="name" required minLength={2} maxLength={120} defaultValue={tool.name} />
        <label htmlFor="tool-edit-category">Category</label>
        <input id="tool-edit-category" name="category" maxLength={80} defaultValue={tool.category ?? ""} />
        <label htmlFor="tool-edit-brand">Brand</label>
        <input id="tool-edit-brand" name="brand" maxLength={80} defaultValue={tool.brand ?? ""} />
        <label htmlFor="tool-edit-model">Model</label>
        <input id="tool-edit-model" name="model" maxLength={120} defaultValue={tool.model ?? ""} />
        <label htmlFor="tool-edit-serial">Serial number</label>
        <input id="tool-edit-serial" name="serialNumber" maxLength={120} defaultValue={tool.serial_number ?? ""} />
        <label htmlFor="tool-edit-description">Description</label>
        <textarea id="tool-edit-description" name="description" maxLength={1000} rows={4} defaultValue={tool.description ?? ""} />
        <label htmlFor="tool-edit-notes">Internal notes</label>
        <textarea id="tool-edit-notes" name="notes" maxLength={1000} rows={4} defaultValue={tool.notes ?? ""} />
        <button type="submit">Save tool details</button>
      </form>
    </section>
  </main>;
}
