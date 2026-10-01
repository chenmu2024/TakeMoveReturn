"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const scheduleInput = z.object({
  toolId: z.string().uuid(), serviceName: z.string().trim().min(2).max(120),
  intervalDays: z.coerce.number().int().min(1).max(3650), nextDueAt: date,
});
const serviceInput = z.object({
  scheduleId: z.string().uuid(), servicedAt: date,
  cost: z.string().regex(/^\d{1,7}(?:\.\d{1,2})?$/), notes: z.string().trim().max(1000),
});
const workOrderInput = z.object({
  toolId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  dueDate: z.union([date, z.literal("")]),
  notes: z.string().trim().max(1000),
});
const workOrderStatusInput = z.object({
  workOrderId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]),
});

async function managerClient() {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: member, error } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (error || !member) redirect("/app/maintenance?notice=unavailable");
  return supabase;
}

export async function scheduleService(form: FormData) {
  const input = scheduleInput.safeParse({
    toolId: form.get("toolId"), serviceName: form.get("serviceName"),
    intervalDays: form.get("intervalDays"), nextDueAt: form.get("nextDueAt"),
  });
  if (!input.success) redirect("/app/maintenance?notice=invalid");
  const supabase = await managerClient();
  const { error } = await supabase.rpc("schedule_tool_service", {
    p_tool_id: input.data.toolId, p_service_name: input.data.serviceName,
    p_interval_days: input.data.intervalDays, p_next_due_at: input.data.nextDueAt,
  });
  redirect(`/app/maintenance?notice=${error ? "unavailable" : "scheduled"}`);
}

export async function recordService(form: FormData) {
  const input = serviceInput.safeParse({
    scheduleId: form.get("scheduleId"), servicedAt: form.get("servicedAt"),
    cost: form.get("cost"), notes: form.get("notes") ?? "",
  });
  if (!input.success) redirect("/app/maintenance?notice=invalid");
  const [whole, cents = ""] = input.data.cost.split(".");
  const costCents = Number(whole) * 100 + Number(cents.padEnd(2, "0"));
  if (costCents > 100000000) redirect("/app/maintenance?notice=invalid");
  const supabase = await managerClient();
  const { error } = await supabase.rpc("record_tool_service", {
    p_schedule_id: input.data.scheduleId, p_serviced_at: input.data.servicedAt,
    p_cost_cents: costCents, p_notes: input.data.notes || null,
  });
  redirect(`/app/maintenance?notice=${error ? "unavailable" : "recorded"}`);
}


export async function createWorkOrder(form: FormData) {
  const input = workOrderInput.safeParse({
    toolId: form.get("toolId"),
    title: form.get("title"),
    dueDate: form.get("dueDate") ?? "",
    notes: form.get("notes") ?? "",
  });
  if (!input.success) redirect("/app/maintenance?notice=work-order-invalid");
  const supabase = await managerClient();
  const { error } = await supabase.rpc("create_work_order", {
    p_tool_id: input.data.toolId,
    p_title: input.data.title,
    p_due_date: input.data.dueDate || null,
    p_notes: input.data.notes,
  });
  redirect(`/app/maintenance?notice=${error ? "work-order-unavailable" : "work-order-created"}`);
}

export async function setWorkOrderStatus(form: FormData) {
  const input = workOrderStatusInput.safeParse({
    workOrderId: form.get("workOrderId"),
    status: form.get("status"),
  });
  if (!input.success) redirect("/app/maintenance?notice=work-order-invalid");
  const supabase = await managerClient();
  const { error } = await supabase.rpc("set_work_order_status", {
    p_work_order_id: input.data.workOrderId,
    p_status: input.data.status,
  });
  redirect(`/app/maintenance?notice=${error ? "work-order-unavailable" : "work-order-updated"}`);
}
