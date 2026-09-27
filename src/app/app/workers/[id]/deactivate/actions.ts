"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../../../lib/supabase/server";

export async function deactivateWorker(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const id = z.string().uuid().safeParse(form.get("workerId"));
  if (!id.success) redirect("/app/workers");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership } = await supabase.from("organization_members").select("company_id")
    .eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (!membership) redirect("/app/onboarding");
  const { data: worker } = await supabase.from("workers").select("id")
    .eq("id", id.data).eq("company_id", membership.company_id).maybeSingle();
  if (!worker) redirect("/app/workers");
  const { error } = await supabase.rpc("deactivate_worker", { p_worker_id: id.data });
  if (error) redirect(`/app/workers/${id.data}/deactivate?notice=unavailable`);
  redirect("/app/workers");
}
