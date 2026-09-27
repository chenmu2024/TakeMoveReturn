import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { updateLocation } from "./actions";
import "../../service.css";

export const metadata: Metadata = { title: "Location | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LocationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id,role").eq("user_id", claims.claims.sub).eq("status", "active")
    .order("created_at").limit(1).maybeSingle();
  if (membershipError) throw new Error("Workspace membership could not be checked.");
  if (!membership) redirect("/app/onboarding");
  const { data: location, error } = await supabase.from("locations")
    .select("id,name,type,address,notes,active").eq("id", id).eq("company_id", membership.company_id).maybeSingle();
  if (error) throw new Error("Location could not be loaded.");
  if (!location) notFound();
  const canManage = ["owner", "admin", "manager"].includes(membership.role);
  const notice = (await searchParams).notice;

  return <main className="service-page"><header><Link href="/app/locations">← Locations</Link><p className="service-eyebrow">LOCATION REGISTER</p><h1>{location.name}</h1><p>This location is {location.active ? "active" : "inactive"}. Changes to its name or address do not rewrite past tool movements.</p></header><section className="service-card" style={{ marginTop: 22 }}><h2>Location details</h2>{notice && <p className="service-notice" role={notice === "saved" ? "status" : "alert"}>{notice === "saved" ? "Location updated." : notice === "invalid" ? "Check the name, type, and field lengths." : "The location could not be updated. Please try again."}</p>}{canManage ? <form action={updateLocation}><input type="hidden" name="id" value={location.id} /><label htmlFor="location-name">Location name</label><input id="location-name" name="name" required minLength={2} maxLength={120} defaultValue={location.name} /><label htmlFor="location-type">Type</label><select id="location-type" name="type" required defaultValue={location.type}><option value="warehouse">Warehouse</option><option value="job_site">Job site</option><option value="truck">Truck</option><option value="other">Other</option></select><label htmlFor="location-address">Address (optional)</label><input id="location-address" name="address" maxLength={300} defaultValue={location.address ?? ""} /><label htmlFor="location-notes">Notes (optional)</label><textarea id="location-notes" name="notes" maxLength={1000} rows={3} defaultValue={location.notes ?? ""} /><button type="submit">Save changes</button></form> : <><p>Type: {location.type.replaceAll("_", " ")}</p><p>Address: {location.address || "—"}</p><p>Notes: {location.notes || "—"}</p><p>A workspace manager can update these details.</p></>}</section></main>;
}
