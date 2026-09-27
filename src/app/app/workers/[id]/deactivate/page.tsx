import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../../lib/supabase/server";
import { deactivateWorker } from "./actions";
import "../../../service.css";

export const metadata: Metadata = { title: "Deactivate worker | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DeactivatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership } = await supabase.from("organization_members").select("company_id")
    .eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (!membership) redirect("/app/onboarding");
  const { data: worker } = await supabase.from("workers").select("id,name,status")
    .eq("id", id).eq("company_id", membership.company_id).maybeSingle();
  if (!worker) notFound();
  return <main className="service-page"><header><Link href="/app/workers">← Workers</Link><p className="service-eyebrow">WORKER SECURITY</p><h1>Deactivate {worker.name}</h1><p>Deactivation immediately ends this worker&apos;s field sessions. Existing tool history remains intact. Re-enabling requires a manager to set a new PIN.</p></header><section className="service-card" style={{ marginTop: 22 }}><h2>Current status: {worker.status}</h2>{(await searchParams).notice && <p className="service-notice" role="alert">The worker could not be deactivated. Try again or contact support.</p>}{worker.status === "active" ? <form action={deactivateWorker}><input type="hidden" name="workerId" value={worker.id} /><button type="submit">Deactivate worker and end sessions</button></form> : <p>This worker is already inactive. Use PIN reset to reactivate securely.</p>}</section></main>;
}
