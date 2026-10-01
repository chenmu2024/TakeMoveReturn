"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { endOfLocalDateUtc } from "../../../../lib/timezone";

const toolDetailsInput = z.object({
  toolId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().max(80),
  brand: z.string().trim().max(80),
  model: z.string().trim().max(120),
  serialNumber: z.string().trim().max(120),
  purchaseDate: z.string().trim().refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Invalid purchase date"),
  purchasePrice: z.string().trim().refine(
    (value) => value === "" || /^\d{1,10}(?:\.\d{1,2})?$/.test(value),
    "Invalid purchase price",
  ),
  description: z.string().trim().max(1000),
  notes: z.string().trim().max(1000),
});

const movementInput = z.object({
  toolId: z.string().uuid(),
  type: z.enum(["checkout", "transfer", "return"]),
  workerId: z.union([z.string().uuid(), z.literal("")]),
  locationId: z.string().uuid(),
  notes: z.string().trim().max(500),
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
  if (rawDate !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) redirect(`${path}?notice=due-invalid`);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect(`${path}?notice=due-unavailable`);
  if (!membership) redirect("/app/onboarding");
  const [{ data: tool, error: toolError }, { data: company, error: companyError }] = await Promise.all([
    supabase.from("tools").select("id").eq("id", id.data).eq("company_id", membership.company_id).maybeSingle(),
    supabase.from("companies").select("timezone").eq("id", membership.company_id).maybeSingle(),
  ]);
  if (toolError || !tool) redirect("/app/tools");
  if (companyError || !company?.timezone) redirect(`${path}?notice=due-unavailable`);
  const dueAt = rawDate === "" ? null : endOfLocalDateUtc(rawDate, company.timezone);
  if (dueAt === null && rawDate !== "") redirect(`${path}?notice=due-invalid`);
  if (dueAt && Date.parse(dueAt) <= Date.now()) redirect(`${path}?notice=due-invalid`);
  const { error } = await supabase.rpc("set_tool_return_due_date", { p_tool_id: id.data, p_due_at: dueAt });
  if (error) redirect(`${path}?notice=${error.message.includes("not checked out") ? "due-state" : "due-unavailable"}`);
  redirect(`${path}?notice=due-saved`);
}


export async function updateToolDetails(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup?notice=unavailable");
  const input = toolDetailsInput.safeParse({
    toolId: form.get("toolId"),
    name: String(form.get("name") ?? ""),
    category: String(form.get("category") ?? ""),
    brand: String(form.get("brand") ?? ""),
    model: String(form.get("model") ?? ""),
    serialNumber: String(form.get("serialNumber") ?? ""),
    purchaseDate: String(form.get("purchaseDate") ?? ""),
    purchasePrice: String(form.get("purchasePrice") ?? ""),
    description: String(form.get("description") ?? ""),
    notes: String(form.get("notes") ?? ""),
  });
  if (!input.success) {
    const rawId = String(form.get("toolId") ?? "");
    redirect(/^[0-9a-f-]{36}$/i.test(rawId) ? `/app/tools/${rawId}/edit?notice=invalid` : "/app/tools");
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect(`/app/tools/${input.data.toolId}/edit?notice=unavailable`);
  if (!membership) redirect("/app/onboarding");

  const { data: tool, error: toolError } = await supabase.from("tools")
    .select("id").eq("id", input.data.toolId).eq("company_id", membership.company_id).maybeSingle();
  if (toolError || !tool) redirect("/app/tools");

  const { error } = await supabase.from("tools").update({
    name: input.data.name,
    category: input.data.category || null,
    brand: input.data.brand || null,
    model: input.data.model || null,
    serial_number: input.data.serialNumber || null,
    purchase_date: input.data.purchaseDate || null,
    purchase_price: input.data.purchasePrice || null,
    description: input.data.description || null,
    notes: input.data.notes || null,
  }).eq("id", input.data.toolId).eq("company_id", membership.company_id);

  if (error) redirect(`/app/tools/${input.data.toolId}/edit?notice=unavailable`);
  redirect(`/app/tools/${input.data.toolId}?notice=details-saved`);
}
