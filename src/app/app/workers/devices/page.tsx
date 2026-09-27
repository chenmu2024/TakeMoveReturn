import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { revokeDevice } from "./actions";
import "../../service.css";

export const metadata: Metadata = { title: "Field devices | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DevicesPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership } = await supabase.from("organization_members").select("company_id")
    .eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (!membership) redirect("/app/onboarding");
  const { data: devices, error } = await supabase.from("field_device_sessions")
    .select("id,created_at,expires_at,revoked_at")
    .eq("company_id", membership.company_id).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Field devices could not be loaded.");
  const notice = (await searchParams).notice;
  return <main className="service-page"><header><Link href="/app/workers">← Workers</Link><p className="service-eyebrow">WORKSPACE / SECURITY</p><h1>Shared field devices</h1><p>Revoke a lost or retired device immediately. This ends every worker session on that device. Re-enrollment requires a manager sign-in.</p></header>{notice && <p className="service-notice" role={notice === "revoked" ? "status" : "alert"}>{notice === "revoked" ? "Device and its worker sessions were revoked." : "Device could not be revoked. Refresh and try again."}</p>}<section className="service-card"><h2>Enrolled devices</h2>{devices?.length ? <ul className="service-list">{devices.map((device) => {
    const active = !device.revoked_at && Date.parse(device.expires_at) > Date.now();
    return <li key={device.id}><span>Enrolled {device.created_at.slice(0, 10)} · {active ? `Expires ${device.expires_at.slice(0, 10)}` : device.revoked_at ? "Revoked" : "Expired"}</span>{active && <form action={revokeDevice}><input type="hidden" name="deviceId" value={device.id} /><button type="submit">Revoke device</button></form>}</li>;
  })}</ul> : <p>No shared field devices have been enrolled.</p>}</section><Link href="/field/enroll">Enroll another device</Link></main>;
}
