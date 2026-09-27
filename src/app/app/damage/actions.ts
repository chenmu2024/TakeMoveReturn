"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

const reportInput = z.object({
  toolId: z.string().uuid(),
  severity: z.enum(["minor", "needs_repair", "unusable", "lost"]),
  description: z.string().trim().min(3).max(1000),
});
const resolutionInput = z.object({ reportId: z.string().uuid(), resolution: z.string().trim().min(3).max(1000) });

async function managerClient() {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: member, error } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (error || !member) redirect("/app/damage?notice=unavailable");
  return supabase;
}

export async function reportDamage(form: FormData) {
  const input = reportInput.safeParse({ toolId: form.get("toolId"), severity: form.get("severity"), description: form.get("description") });
  if (!input.success) redirect("/app/damage?notice=invalid");
  const supabase = await managerClient();
  const { error } = await supabase.rpc("report_tool_damage", {
    p_tool_id: input.data.toolId, p_severity: input.data.severity, p_description: input.data.description,
  });
  redirect(`/app/damage?notice=${error ? "unavailable" : "reported"}`);
}

export async function resolveDamage(form: FormData) {
  const input = resolutionInput.safeParse({ reportId: form.get("reportId"), resolution: form.get("resolution") });
  if (!input.success) redirect("/app/damage?notice=invalid");
  const supabase = await managerClient();
  const { error } = await supabase.rpc("resolve_tool_damage", {
    p_report_id: input.data.reportId, p_resolution: input.data.resolution,
  });
  redirect(`/app/damage?notice=${error ? "unavailable" : "resolved"}`);
}
