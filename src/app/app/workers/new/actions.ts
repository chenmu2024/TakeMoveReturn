"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashWorkerPin } from "../../../../lib/security/worker-pin";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

const workerInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40),
  employeeCode: z.string().trim().max(80),
  pin: z.string().regex(/^\d{6}$/),
});

export async function createWorker(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup?notice=unavailable");
  const input = workerInput.safeParse({
    name: form.get("name"),
    phone: form.get("phone"),
    employeeCode: form.get("employeeCode"),
    pin: form.get("pin"),
  });
  if (!input.success) redirect("/app/workers/new?notice=invalid");
  if (input.data.employeeCode && input.data.employeeCode === input.data.pin) redirect("/app/workers/new?notice=code-matches-pin");
  const pepper = process.env.WORKER_PIN_PEPPER;
  if (!pepper) redirect("/app/workers/new?notice=unavailable");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect("/app/workers/new?notice=unavailable");
  if (!membership) redirect("/app/onboarding");

  const pin = await hashWorkerPin(input.data.pin, pepper);
  const { error } = await supabase.rpc("create_worker", {
    p_company_id: membership.company_id,
    p_name: input.data.name,
    p_phone: input.data.phone || null,
    p_employee_code: input.data.employeeCode || null,
    p_pin_hash: pin.hash,
    p_pin_salt: pin.salt,
  });
  if (error) redirect("/app/workers/new?notice=unavailable");
  redirect("/app/workers");
}
