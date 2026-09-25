import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { createWorker } from "./actions";

export const metadata: Metadata = { title: "Add a Worker | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewWorkerPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
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
    .select("name").eq("id", membership.company_id).single();
  if (companyError || !company) throw new Error("Company could not be loaded.");
  const notice = (await searchParams).notice;
  const pinReady = Boolean(process.env.WORKER_PIN_PEPPER);

  return <main className="auth-page"><section className="auth-brand-panel"><Link className="auth-brand" href="/app/workers"><strong>TakeMoveReturn</strong><span>{company.name}</span></Link><div className="auth-brand-copy"><p className="eyebrow">FIELD WORKERS</p><h1>Know who has each tool.</h1><ul><li><IconCheck size={17} aria-hidden="true" />One identity for each field worker</li><li><IconCheck size={17} aria-hidden="true" />A six-digit PIN for future shared-device access</li><li><IconCheck size={17} aria-hidden="true" />Private to your company</li></ul></div></section><section className="auth-card-panel"><div className="auth-card"><p className="eyebrow">ADD WORKER</p><h2>Create a worker record.</h2><p className="auth-detail">Use the name your crew recognizes. Do not reuse a personal banking or phone PIN. The employee code must differ from the PIN.</p>{notice && <p className="auth-connection-note" role="alert">{notice === "code-matches-pin" ? "Employee code cannot be the same as the PIN." : notice === "invalid" ? "Check the name, field lengths, and six-digit PIN." : "The worker could not be saved. Please try again or contact support."}</p>}{!pinReady && <p className="auth-connection-note" role="status">Worker PIN security is not configured in this environment yet. Ask the workspace operator to finish setup.</p>}<form className="auth-form" action={createWorker}><label htmlFor="worker-name">Worker name</label><input id="worker-name" name="name" type="text" required minLength={2} maxLength={120} autoComplete="name" placeholder="John Martinez" /><label htmlFor="worker-code">Employee code (optional)</label><input id="worker-code" name="employeeCode" type="text" maxLength={80} placeholder="Crew identifier" /><label htmlFor="worker-phone">Phone (optional)</label><input id="worker-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" /><label htmlFor="worker-pin">Six-digit worker PIN</label><input id="worker-pin" name="pin" type="password" required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="new-password" /><button className="auth-submit" type="submit" disabled={!pinReady}>Save worker <IconArrowRight size={17} aria-hidden="true" /></button></form><Link className="auth-secondary-link" href="/app/workers">Back to workers</Link></div></section></main>;
}
