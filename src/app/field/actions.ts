"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "../../lib/supabase/server";
import { verifyWorkerPin } from "../../lib/security/worker-pin";
import { DEVICE_COOKIE, WORKER_COOKIE, fieldDb, fieldDevice, fieldReady, fieldWorker, randomToken, tokenHash } from "../../lib/field/server";

const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

export async function enrollDevice() {
  if (!fieldReady()) redirect("/field/enroll?notice=unavailable");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).order("created_at").limit(1).maybeSingle();
  if (!membership) redirect("/app/onboarding");
  const raw = randomToken();
  const hash = await tokenHash(raw);
  const { error } = await supabase.rpc("enroll_field_device", { p_company_id: membership.company_id, p_token_hash: hash });
  if (error) redirect("/field/enroll?notice=unavailable");
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) redirect("/field/enroll?notice=unavailable");
  const store = await cookies();
  store.set(DEVICE_COOKIE, raw, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 });
  store.delete(WORKER_COOKIE);
  redirect("/field");
}

export async function signInWorker(form: FormData) {
  if (await fieldWorker()) redirect("/field");
  const input = z.object({ workerId: z.string().uuid(), pin: z.string().regex(/^\d{6}$/) }).safeParse({
    workerId: form.get("workerId"), pin: form.get("pin"),
  });
  if (!input.success) redirect("/field?notice=invalid");
  const device = await fieldDevice();
  if (!device) redirect("/field?notice=device");
  const ip = (await headers()).get("cf-connecting-ip") || "unknown";
  const ipDigest = await crypto.subtle.sign("HMAC", await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(process.env.WORKER_PIN_PEPPER!),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  ), new TextEncoder().encode(ip));
  const ipHash = Buffer.from(ipDigest).toString("hex");
  const db = fieldDb();
  const { data: attempt, error } = await db.rpc("begin_field_pin_attempt", {
    p_device_hash: device.hash, p_worker_id: input.data.workerId, p_ip_hash: ipHash,
  }).maybeSingle();
  if (error || !attempt) redirect("/field?notice=invalid");
  const challenge = attempt as { attempt_id: string; pin_hash: string; pin_salt: string; pin_iterations: number; pin_version: 1 };
  let valid = false;
  try {
    valid = await verifyWorkerPin(input.data.pin, process.env.WORKER_PIN_PEPPER!, {
      hash: challenge.pin_hash, salt: challenge.pin_salt, iterations: challenge.pin_iterations,
      version: challenge.pin_version,
    });
  } catch { /* Invalid PIN material must not bypass the attempt log. */ }
  const raw = randomToken();
  const hash = await tokenHash(raw);
  const { data: saved, error: saveError } = await db.rpc("complete_field_pin_attempt", {
    p_attempt_id: challenge.attempt_id, p_success: valid, p_session_hash: hash,
  });
  if (!valid || saveError || !saved) redirect("/field?notice=invalid");
  (await cookies()).set(WORKER_COOKIE, raw, { ...cookieOptions, maxAge: 8 * 60 * 60 });
  redirect("/field");
}

export async function lockWorker() {
  const session = await fieldWorker();
  if (session) {
    const { error } = await fieldDb().from("worker_sessions").update({ revoked_at: new Date().toISOString() })
      .eq("session_token_hash", session.hash);
    if (error) throw new Error("Worker session could not be locked.");
  }
  (await cookies()).delete(WORKER_COOKIE);
  redirect("/field");
}

export async function recordFieldMovement(form: FormData) {
  const input = z.object({ token: z.string().regex(/^[0-9a-f]{64}$/),
    type: z.enum(["checkout", "transfer", "return"]), locationId: z.string().uuid(),
    notes: z.string().trim().max(500),
  }).safeParse({ token: form.get("token"), type: form.get("type"),
    locationId: form.get("locationId"), notes: form.get("notes") ?? "" });
  if (!input.success) redirect("/field?notice=invalid");
  const session = await fieldWorker();
  if (!session) redirect(`/q/${input.data.token}?notice=session#movement-status`);
  const { error } = await fieldDb().rpc("record_field_tool_transaction", {
    p_session_hash: session.hash, p_device_hash: session.device.hash,
    p_qr_token: input.data.token, p_type: input.data.type,
    p_location_id: input.data.locationId, p_notes: input.data.notes || null,
  });
  redirect(`/q/${input.data.token}?notice=${error ? "state" : `${input.data.type}-saved`}#movement-status`);
}


export async function reportFieldIssue(form: FormData) {
  const input = z.object({
    token: z.string().regex(/^[0-9a-f]{64}$/),
    issueType: z.enum(["damage", "missing"]),
    severity: z.enum(["minor", "needs_repair", "unusable", "lost"]).default("minor"),
    description: z.string().trim().min(3).max(1000),
  }).safeParse({
    token: form.get("token"),
    issueType: form.get("issueType"),
    severity: form.get("severity") ?? "minor",
    description: form.get("description"),
  });
  if (!input.success) redirect("/field?notice=invalid");

  const session = await fieldWorker();
  if (!session) redirect(`/q/${input.data.token}?notice=session#issue-status`);

  const { error } = await fieldDb().rpc("report_field_tool_issue", {
    p_session_hash: session.hash,
    p_device_hash: session.device.hash,
    p_qr_token: input.data.token,
    p_issue_type: input.data.issueType,
    p_severity: input.data.issueType === "missing" ? "lost" : input.data.severity,
    p_description: input.data.description,
  });
  redirect(`/q/${input.data.token}?notice=${error ? "issue-state" : input.data.issueType === "missing" ? "missing-saved" : "damage-saved"}#issue-status`);
}
