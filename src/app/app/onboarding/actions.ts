"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

export async function createCompany(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup?notice=unavailable");

  const name = String(form.get("company") ?? "").trim();
  if (name.length < 2 || name.length > 120) redirect("/app/onboarding?notice=invalid");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");

  const { error } = await supabase.rpc("create_company", { p_name: name });
  if (error) redirect("/app/onboarding?notice=failed");
  redirect("/app/dashboard");
}
