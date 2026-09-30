import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { plans, type PlanId } from "../../../../config/plans";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { createTool } from "./actions";

export const metadata: Metadata = { title: "Add a Tool | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const notices: Record<string, string> = {
  invalid: "Enter a tool name of 2 to 120 characters. An optional asset code may be up to 80 characters.",
  duplicate: "This asset code is already in use for your company.",
  limit: "Your plan's active-tool limit has been reached. Existing tracking remains available.",
  unavailable: "The tool could not be saved. Please try again or contact support.",
};

export default async function NewToolPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) throw new Error("Workspace membership could not be checked.");
  if (!membership) redirect("/app/onboarding");
  const { data: company, error: companyError } = await supabase.from("companies")
    .select("name,plan").eq("id", membership.company_id).single();
  if (companyError || !company) throw new Error("Company plan could not be loaded.");
  const { count, error: countError } = await supabase.from("tools")
    .select("id", { count: "exact", head: true }).eq("company_id", membership.company_id).neq("status", "retired");
  if (countError) throw new Error("Tool capacity could not be checked.");
  const limit = plans[company.plan as PlanId].toolLimit;
  const notice = (await searchParams).notice;

  return <main className="auth-page"><section className="auth-brand-panel"><Link className="auth-brand" href="/app/tools"><strong>TakeMoveReturn</strong><span>{company.name}</span></Link><div className="auth-brand-copy"><p className="eyebrow">FIRST TOOL</p><h1>Add a tool. Print its QR. Start tracking.</h1><ul><li><IconCheck size={17} aria-hidden="true" />Only the tool name is required</li><li><IconCheck size={17} aria-hidden="true" />A unique asset code can be generated for you</li><li><IconCheck size={17} aria-hidden="true" />Go straight to the printable QR label</li></ul></div></section><section className="auth-card-panel"><div className="auth-card"><p className="eyebrow">ADD TOOL</p><h2>What tool are you tracking?</h2><p className="auth-detail">{count ?? 0} of {limit} active tools used on your {company.plan} plan.</p>{notice && notices[notice] && <p className="auth-connection-note" role="alert">{notices[notice]}</p>}{(count ?? 0) >= limit ? <p className="auth-connection-note">Tool creation is paused at the plan limit. Your existing tools and history remain available.</p> : <form className="auth-form" action={createTool}><label htmlFor="tool-name">Tool name</label><input id="tool-name" name="name" type="text" required minLength={2} maxLength={120} placeholder="M18 Impact Driver" /><label htmlFor="tool-code">Asset code (optional)</label><input id="tool-code" name="assetCode" type="text" maxLength={80} placeholder="Leave blank to generate one" /><p className="auth-detail">Current location: add later. You can start with the QR label without filling in extra details.</p><label htmlFor="tool-category">Category (optional)</label><input id="tool-category" name="category" type="text" maxLength={80} placeholder="Power tools" /><button className="auth-submit" type="submit">Save and view QR <IconArrowRight size={17} aria-hidden="true" /></button></form>}<Link className="auth-secondary-link" href="/app/tools">Back to tools</Link></div></section></main>;
}
