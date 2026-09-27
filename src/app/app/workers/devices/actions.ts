"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

export async function revokeDevice(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const id = z.string().uuid().safeParse(form.get("deviceId"));
  if (!id.success) redirect("/app/workers/devices?notice=invalid");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership } = await supabase.from("organization_members").select("company_id")
    .eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (!membership) redirect("/app/onboarding");
  const { data: device } = await supabase.from("field_device_sessions").select("id")
    .eq("id", id.data).eq("company_id", membership.company_id).maybeSingle();
  if (!device) redirect("/app/workers/devices?notice=invalid");
  const { error } = await supabase.rpc("revoke_field_device", { p_device_id: id.data });
  redirect(`/app/workers/devices?notice=${error ? "unavailable" : "revoked"}`);
}
