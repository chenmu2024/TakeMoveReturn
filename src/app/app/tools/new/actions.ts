"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

export async function createTool(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup?notice=unavailable");
  const assetCode = String(form.get("assetCode") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();
  if (!assetCode || assetCode.length > 80 || name.length < 2 || name.length > 120 || category.length > 80) {
    redirect("/app/tools/new?notice=invalid");
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect("/app/tools/new?notice=unavailable");
  if (!membership) redirect("/app/onboarding");

  const { error } = await supabase.rpc("create_tool", {
    p_company_id: membership.company_id,
    p_asset_code: assetCode,
    p_name: name,
    p_category: category || null,
  });
  if (error?.code === "23505") redirect("/app/tools/new?notice=duplicate");
  if (error?.message.includes("Tool limit reached")) redirect("/app/tools/new?notice=limit");
  if (error) redirect("/app/tools/new?notice=unavailable");
  redirect("/app/tools");
}
