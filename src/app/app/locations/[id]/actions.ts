"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

const locationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["warehouse", "job_site", "truck", "other"]),
  address: z.string().trim().max(300),
  notes: z.string().trim().max(1000),
});

export async function updateLocation(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const id = z.string().uuid().safeParse(form.get("id"));
  if (!id.success) redirect("/app/locations");
  const path = `/app/locations/${id.data}`;
  const parsed = locationSchema.safeParse({
    id: id.data,
    name: form.get("name"),
    type: form.get("type"),
    address: form.get("address") ?? "",
    notes: form.get("notes") ?? "",
  });
  if (!parsed.success) redirect(`${path}?notice=invalid`);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect(`${path}?notice=unavailable`);
  if (!membership) redirect("/app/onboarding");
  const { data: location, error } = await supabase.from("locations")
    .update({ name: parsed.data.name, type: parsed.data.type,
      address: parsed.data.address || null, notes: parsed.data.notes || null,
      updated_at: new Date().toISOString() })
    .eq("id", id.data).eq("company_id", membership.company_id).select("id").maybeSingle();
  if (error) redirect(`${path}?notice=unavailable`);
  if (!location) redirect("/app/locations");
  redirect(`${path}?notice=saved`);
}
