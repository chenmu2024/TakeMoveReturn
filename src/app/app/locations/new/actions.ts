"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

const locationTypes = ["warehouse", "job_site", "truck", "other"];

export async function createLocation(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup?notice=unavailable");
  const name = String(form.get("name") ?? "").trim();
  const type = String(form.get("type") ?? "");
  const address = String(form.get("address") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  if (name.length < 2 || name.length > 120 || !locationTypes.includes(type) || address.length > 300 || notes.length > 1000) {
    redirect("/app/locations/new?notice=invalid");
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect("/app/locations/new?notice=unavailable");
  if (!membership) redirect("/app/onboarding");

  const { error } = await supabase.from("locations").insert({
    company_id: membership.company_id,
    name,
    type,
    address: address || null,
    notes: notes || null,
  });
  if (error) redirect("/app/locations/new?notice=unavailable");
  redirect("/app/locations");
}
