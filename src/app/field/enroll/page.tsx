import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { fieldReady } from "../../../lib/field/server";
import { enrollDevice } from "../actions";
import "../../q/[token]/scan.css";

export const metadata: Metadata = { title: "Enroll field device | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EnrollPage() {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership } = await supabase.from("organization_members").select("company_id")
    .eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (!membership) redirect("/app/onboarding");
  return <main className="scan-page"><section className="scan-card"><p className="workspace-eyebrow">MANAGER SETUP</p><h1>Enroll a shared field device</h1><p>This device will remember the company for up to 30 days, but each worker still needs their own PIN. Enrolling signs the manager out of this browser so the shared device cannot retain manager access.</p>{!fieldReady() && <p role="alert">Field access is not configured in this environment.</p>}<form action={enrollDevice}><button className="workspace-button" type="submit" disabled={!fieldReady()}>Enroll and sign out</button></form><Link href="/app/workers">Back to workers</Link></section></main>;
}
