"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

export async function rotateToolQr(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/login");
  const toolId = formData.get("toolId");
  if (typeof toolId !== "string" || !/^[0-9a-f-]{36}$/i.test(toolId)) redirect("/app/tools");
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", auth.user.id).eq("status", "active")
    .in("role", ["owner", "admin"]).limit(1).maybeSingle();
  if (membershipError || !membership) redirect(`/app/tools/${toolId}?notice=qr-error`);
  const { data: tool, error: toolError } = await supabase.from("tools")
    .select("id").eq("id", toolId).eq("company_id", membership.company_id).maybeSingle();
  if (toolError || !tool) redirect(`/app/tools/${toolId}?notice=qr-error`);
  const { error } = await supabase.rpc("rotate_tool_qr", { p_tool_id: toolId });
  redirect(`/app/tools/${toolId}?notice=${error ? "qr-error" : "qr-rotated"}`);
}
