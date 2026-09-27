"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

const inputSchema = z.object({ workerId: z.string().uuid(), locationId: z.string().uuid() });

export async function returnAllWorkerTools(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const rawId = form.get("workerId");
  const workerId = z.string().uuid().safeParse(rawId);
  if (!workerId.success) redirect("/app/workers");
  const path = `/app/workers/${workerId.data}`;
  const input = inputSchema.safeParse({ workerId: rawId, locationId: form.get("locationId") });
  if (!input.success) redirect(`${path}?notice=invalid`);
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect(`${path}?notice=unavailable`);
  if (!membership) redirect("/app/onboarding");
  const { data: worker, error: workerError } = await supabase.from("workers")
    .select("id").eq("id", workerId.data).eq("company_id", membership.company_id).maybeSingle();
  if (workerError || !worker) redirect("/app/workers");
  const { error } = await supabase.rpc("return_worker_tools", {
    p_worker_id: input.data.workerId, p_location_id: input.data.locationId,
  });
  if (error) {
    const notice = error.message.includes("Ineligible tools") ? "state"
      : error.message.includes("Too many tools") ? "limit"
      : error.message.includes("No tools") ? "empty" : "unavailable";
    redirect(`${path}?notice=${notice}`);
  }
  redirect(`${path}?notice=returned`);
}

const transferInput = z.object({
  workerId: z.string().uuid(),
  toolIds: z.array(z.string().uuid()).min(1).max(25),
  toWorkerId: z.string().uuid(),
  locationId: z.string().uuid(),
});

export async function transferSelectedWorkerTools(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const workerId = z.string().uuid().safeParse(form.get("workerId"));
  if (!workerId.success) redirect("/app/workers");
  const path = `/app/workers/${workerId.data}`;
  const input = transferInput.safeParse({
    workerId: form.get("workerId"), toolIds: form.getAll("toolId"),
    toWorkerId: form.get("toWorkerId"), locationId: form.get("locationId"),
  });
  if (!input.success || new Set(input.data.toolIds).size !== input.data.toolIds.length
    || input.data.workerId === input.data.toWorkerId) redirect(`${path}?notice=invalid-transfer`);
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect(`${path}?notice=unavailable`);
  if (!membership) redirect("/app/onboarding");
  const { data: worker, error: workerError } = await supabase.from("workers")
    .select("id").eq("id", workerId.data).eq("company_id", membership.company_id).maybeSingle();
  if (workerError || !worker) redirect("/app/workers");
  const { error } = await supabase.rpc("transfer_worker_tools", {
    p_source_worker_id: input.data.workerId,
    p_tool_ids: input.data.toolIds,
    p_to_worker_id: input.data.toWorkerId,
    p_location_id: input.data.locationId,
  });
  if (error) redirect(`${path}?notice=${error.message.includes("Ineligible tools") ? "transfer-state" : "unavailable"}`);
  redirect(`${path}?notice=transferred`);
}
