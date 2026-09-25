import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { createClient, isSupabaseConfigured } from "../../../../../lib/supabase/server";
import { resetWorkerPin } from "./actions";

export const metadata: Metadata = { title: "Worker Security | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function WorkerSecurityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
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
  const { data: worker, error: workerError } = await supabase.from("workers")
    .select("id,name,status").eq("id", id).eq("company_id", membership.company_id).maybeSingle();
  if (workerError) throw new Error("Worker could not be loaded.");
  if (!worker) notFound();
  const notice = (await searchParams).notice;
  const pinReady = Boolean(process.env.WORKER_PIN_PEPPER);

  return <main className="auth-page"><section className="auth-brand-panel"><Link className="auth-brand" href="/app/workers"><strong>TakeMoveReturn</strong><span>Worker security</span></Link><div className="auth-brand-copy"><p className="eyebrow">WORKER ACCESS</p><h1>Keep field access in the right hands.</h1><ul><li><IconCheck size={17} aria-hidden="true" />Changing a PIN ends previous worker sessions</li><li><IconCheck size={17} aria-hidden="true" />Only workspace managers can reset access</li></ul></div></section><section className="auth-card-panel"><div className="auth-card"><p className="eyebrow">RESET PIN</p><h2>{worker.name}</h2><p className="auth-detail">Current status: {worker.status}. Set a new six-digit PIN privately. Do not reuse an exposed PIN or employee code.</p>{notice && <p className="auth-connection-note" role="alert">{notice === "invalid" ? "Enter the same six-digit PIN twice." : notice === "code-matches-pin" ? "The PIN must differ from the employee code." : "The PIN could not be changed. Please try again or contact support."}</p>}{!pinReady && <p className="auth-connection-note" role="status">PIN security is not configured in this environment.</p>}<form className="auth-form" action={resetWorkerPin}><input type="hidden" name="workerId" value={worker.id} /><label htmlFor="new-worker-pin">New six-digit PIN</label><input id="new-worker-pin" name="pin" type="password" required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="new-password" /><label htmlFor="confirm-worker-pin">Confirm new PIN</label><input id="confirm-worker-pin" name="confirmPin" type="password" required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="new-password" /><label htmlFor="activate-worker" style={{ display: "flex", alignItems: "center", gap: 8 }}><input id="activate-worker" name="activate" type="checkbox" style={{ width: "auto" }} /> Activate worker after PIN reset</label><button className="auth-submit" type="submit" disabled={!pinReady}>Save new PIN <IconArrowRight size={17} aria-hidden="true" /></button></form><Link className="auth-secondary-link" href="/app/workers">Back to workers</Link></div></section></main>;
}
