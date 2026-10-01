"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

const movementInput = z.object({
  toolId: z.string().uuid(),
  type: z.enum(["checkout", "transfer", "return"]),
  workerId: z.union([z.string().uuid(), z.literal("")]),
  locationId: z.string().uuid(),
  notes: z.string().trim().max(500),
});

const correctionInput = z.object({
  toolId: z.string().uuid(),
  workerId: z.union([z.string().uuid(), z.literal("")]),
  locationId: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
  reversesTransactionId: z.union([z.string().uuid(), z.literal("")]),
});

export async function recordToolMovement(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup?notice=unavailable");
  const rawId = String(form.get("toolId") ?? "");
  const id = z.string().uuid().safeParse(rawId);
  if (!id.success) redirect("/app/tools");
  const path = `/app/tools/${id.data}`;
  const input = movementInput.safeParse({
    toolId: rawId,
    type: form.get("type"),
    workerId: form.get("workerId") ?? "",
    locationId: form.get("locationId"),
    notes: form.get("notes") ?? "",
  });
  if (!input.success || (input.data.type === "checkout" && !input.data.workerId)) redirect(`${path}?notice=invalid`);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect(`${path}?notice=unavailable`);
  if (!membership) redirect("/app/onboarding");
  const { data: tool, error: toolError } = await supabase.from("tools")
    .select("id").eq("id", id.data).eq("company_id", membership.company_id).maybeSingle();
  if (toolError || !tool) redirect("/app/tools");

  const { error } = await supabase.rpc("record_tool_transaction", {
    p_tool_id: id.data,
    p_transaction_type: input.data.type,
    p_to_worker_id: input.data.type === "return" ? null : input.data.workerId || null,
    p_to_location_id: input.data.locationId,
    p_notes: input.data.notes || null,
  });
  if (error) {
    const notice = error.message.includes("not available") || error.message.includes("not checked out") || error.message.includes("cannot be transferred") ? "state" : "unavailable";
    redirect(`${path}?notice=${notice}`);
  }
  redirect(`${path}?notice=saved`);
}

export async function setToolReturnDueDate(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup?notice=unavailable");
  const id = z.string().uuid().safeParse(String(form.get("toolId") ?? ""));
  if (!id.success) redirect("/app/tools");
  const path = `/app/tools/${id.data}`;
  const rawDate = String(form.get("dueDate") ?? "");
  const dueDate = rawDate === "" ? null : /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : undefined;
  if (dueDate === undefined) redirect(`${path}?notice=due-invalid`);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect(`${path}?notice=due-unavailable`);
  if (!membership) redirect("/app/onboarding");
  const { data: tool, error: toolError } = await supabase.from("tools")
    .select("id").eq("id", id.data).eq("company_id", membership.company_id).maybeSingle();
  if (toolError || !tool) redirect("/app/tools");
  const { error } = await supabase.rpc("set_tool_return_due_date", { p_tool_id: id.data, p_due_date: dueDate });
  if (error) {
    if (error.message.includes("not checked out")) redirect(`${path}?notice=due-state`);
    if (error.message.includes("past")) redirect(`${path}?notice=due-invalid`);
    redirect(`${path}?notice=due-unavailable`);
  }
  redirect(`${path}?notice=due-saved`);
}


export async function correctToolCustody(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup?notice=unavailable");
  const parsed = correctionInput.safeParse({
    toolId: form.get("toolId"),
    workerId: form.get("workerId") ?? "",
    locationId: form.get("locationId"),
    reason: form.get("reason"),
    reversesTransactionId: form.get("reversesTransactionId") ?? "",
  });
  if (!parsed.success) redirect("/app/tools");

  const path = `/app/tools/${parsed.data.toolId}`;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");

  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect(`${path}?notice=correction-unavailable`);
  if (!membership) redirect("/app/onboarding");

  const { data: tool, error: toolError } = await supabase.from("tools")
    .select("id").eq("id", parsed.data.toolId).eq("company_id", membership.company_id).maybeSingle();
  if (toolError || !tool) redirect("/app/tools");

  const { error } = await supabase.rpc("correct_tool_custody", {
    p_tool_id: parsed.data.toolId,
    p_to_worker_id: parsed.data.workerId || null,
    p_to_location_id: parsed.data.locationId,
    p_reason: parsed.data.reason,
    p_reverses_transaction_id: parsed.data.reversesTransactionId || null,
  });
  if (error) redirect(`${path}?notice=correction-unavailable`);
  redirect(`${path}?notice=correction-saved`);
}
