import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { createLocation } from "./actions";

export const metadata: Metadata = { title: "Add a Location | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewLocationPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
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

  return <main className="auth-page"><section className="auth-brand-panel"><Link className="auth-brand" href="/app/locations"><strong>TakeMoveReturn</strong><span>{company.name}</span></Link><div className="auth-brand-copy"><p className="eyebrow">LOCATION REGISTER</p><h1>Give every tool a place to be.</h1><ul><li><IconCheck size={17} aria-hidden="true" />Warehouses and job sites</li><li><IconCheck size={17} aria-hidden="true" />Trucks and other storage points</li><li><IconCheck size={17} aria-hidden="true" />Visible only to your company</li></ul></div></section><section className="auth-card-panel"><div className="auth-card"><p className="eyebrow">ADD LOCATION</p><h2>Name this place.</h2><p className="auth-detail">Use a name your crew will recognize when recording a tool movement.</p>{notice && <p className="auth-connection-note" role="alert">{notice === "invalid" ? "Check the location name, type, and field lengths." : "The location could not be saved. Please try again or contact support."}</p>}<form className="auth-form" action={createLocation}><label htmlFor="location-name">Location name</label><input id="location-name" name="name" type="text" required minLength={2} maxLength={120} placeholder="Main warehouse" /><label htmlFor="location-type">Type</label><select id="location-type" name="type" required defaultValue="warehouse"><option value="warehouse">Warehouse</option><option value="job_site">Job site</option><option value="truck">Truck</option><option value="other">Other</option></select><label htmlFor="location-address">Address (optional)</label><input id="location-address" name="address" type="text" maxLength={300} placeholder="Street or site address" /><label htmlFor="location-notes">Notes (optional)</label><textarea id="location-notes" name="notes" maxLength={1000} rows={3} placeholder="Access instructions or internal reference" /><button className="auth-submit" type="submit">Save location <IconArrowRight size={17} aria-hidden="true" /></button></form><Link className="auth-secondary-link" href="/app/locations">Back to locations</Link></div></section></main>;
}
