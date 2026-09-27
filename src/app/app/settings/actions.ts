"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(1).max(64).refine((timezone) => {
    try { new Intl.DateTimeFormat("en", { timeZone: timezone }); return true; }
    catch { return false; }
  }),
});

export async function updateCompanySettings(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const parsed = settingsSchema.safeParse({ name: form.get("name"), timezone: form.get("timezone") });
  if (!parsed.success) redirect("/app/settings?notice=settings-invalid");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect("/app/settings?notice=settings-unavailable");
  if (!membership) redirect("/app/settings?notice=settings-forbidden");
  const { error } = await supabase.rpc("update_company_settings", {
    p_company_id: membership.company_id,
    p_name: parsed.data.name,
    p_timezone: parsed.data.timezone,
  });
  if (error) redirect("/app/settings?notice=settings-unavailable");
  redirect("/app/settings?notice=settings-saved");
}
