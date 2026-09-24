import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { createCompany } from "./actions";

export const metadata: Metadata = { title: "Set Up Your Company | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership, error } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active").limit(1).maybeSingle();
  if (error) throw new Error("Workspace membership could not be checked.");
  if (membership) redirect("/app/dashboard");

  const notice = (await searchParams).notice;
  return <main className="auth-page"><section className="auth-brand-panel"><Link className="auth-brand" href="/"><strong>TakeMoveReturn</strong><span>Construction Tool Tracking Software</span></Link><div className="auth-brand-copy"><p className="eyebrow">YOUR FIRST WORKSPACE</p><h1>Keep every handoff in one place.</h1><ul><li><IconCheck size={17} aria-hidden="true" />Add your company</li><li><IconCheck size={17} aria-hidden="true" />Register your first tool</li><li><IconCheck size={17} aria-hidden="true" />Start tracking with your crew</li></ul></div></section><section className="auth-card-panel"><div className="auth-card"><p className="eyebrow">COMPANY SETUP</p><h2>Name your workspace.</h2><p className="auth-detail">This name identifies the company whose tools and activity you manage. You can set up locations and workers after this step.</p>{notice && <p className="auth-connection-note" role="alert">{notice === "invalid" ? "Enter a company name between 2 and 120 characters." : "We could not create the workspace. Please try again or contact support."}</p>}<form className="auth-form" action={createCompany}><label htmlFor="company-name">Company name</label><input id="company-name" name="company" type="text" minLength={2} maxLength={120} required autoComplete="organization" placeholder="Your construction company" /><button className="auth-submit" type="submit">Create workspace <IconArrowRight size={17} aria-hidden="true" /></button></form><p className="auth-legal-note">Only your signed-in account can create this workspace. Company access will be governed by membership and database security rules.</p></div></section></main>;
}
