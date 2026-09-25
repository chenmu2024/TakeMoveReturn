"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashWorkerPin } from "../../../../../lib/security/worker-pin";
import { createClient, isSupabaseConfigured } from "../../../../../lib/supabase/server";

const workerId = z.string().uuid();
const pinInput = z.string().regex(/^\d{6}$/);

export async function resetWorkerPin(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup?notice=unavailable");
  const id = workerId.safeParse(form.get("workerId"));
  if (!id.success) redirect("/app/workers");
  const path = `/app/workers/${id.data}/security`;
  const pin = pinInput.safeParse(form.get("pin"));
  const confirmation = pinInput.safeParse(form.get("confirmPin"));
  if (!pin.success || !confirmation.success || pin.data !== confirmation.data) redirect(`${path}?notice=invalid`);
  const pepper = process.env.WORKER_PIN_PEPPER;
  if (!pepper) redirect(`${path}?notice=unavailable`);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect(`${path}?notice=unavailable`);
  if (!membership) redirect("/app/onboarding");
  const { data: worker, error: workerError } = await supabase.from("workers")
    .select("id,employee_code").eq("id", id.data).eq("company_id", membership.company_id).maybeSingle();
  if (workerError || !worker) redirect("/app/workers");
  if (worker.employee_code && worker.employee_code === pin.data) redirect(`${path}?notice=code-matches-pin`);

  const nextPin = await hashWorkerPin(pin.data, pepper);
  const { error } = await supabase.rpc("reset_worker_pin", {
    p_worker_id: id.data,
    p_pin_hash: nextPin.hash,
    p_pin_salt: nextPin.salt,
    p_activate: form.get("activate") === "on",
  });
  if (error) redirect(`${path}?notice=unavailable`);
  redirect("/app/workers?notice=pin-reset");
}
