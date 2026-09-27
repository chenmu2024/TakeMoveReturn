import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const DEVICE_COOKIE = "tmr_field_device";
export const WORKER_COOKIE = "tmr_field_worker";

export function fieldReady() {
  return process.env.SUPABASE_AUTH_ENABLED === "true" && Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.WORKER_PIN_PEPPER,
  );
}

export function fieldDb() {
  if (!fieldReady()) throw new Error("Field access is not configured.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function randomToken() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex");
}

export async function tokenHash(value: string) {
  if (!/^[0-9a-f]{64}$/.test(value)) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("hex");
}

export async function fieldDevice() {
  if (!fieldReady()) return null;
  const raw = (await cookies()).get(DEVICE_COOKIE)?.value ?? "";
  const hash = await tokenHash(raw);
  if (!hash) return null;
  const { data, error } = await fieldDb().from("field_device_sessions")
    .select("id,company_id,expires_at,revoked_at")
    .eq("device_token_hash", hash).maybeSingle();
  if (error || !data || data.revoked_at || Date.parse(data.expires_at) <= Date.now()) return null;
  return { ...data, hash };
}

export async function fieldWorker() {
  const device = await fieldDevice();
  if (!device) return null;
  const raw = (await cookies()).get(WORKER_COOKIE)?.value ?? "";
  const hash = await tokenHash(raw);
  if (!hash) return null;
  const db = fieldDb();
  const { data: session, error } = await db.from("worker_sessions")
    .select("id,company_id,worker_id,worker_auth_version,device_session_id,idle_expires_at,absolute_expires_at,revoked_at")
    .eq("session_token_hash", hash).maybeSingle();
  if (error || !session || session.revoked_at || session.device_session_id !== device.id
    || session.company_id !== device.company_id || Date.parse(session.idle_expires_at) <= Date.now()
    || Date.parse(session.absolute_expires_at) <= Date.now()) return null;
  const { data: worker } = await db.from("workers").select("id,name,status,auth_version")
    .eq("id", session.worker_id).eq("company_id", device.company_id).maybeSingle();
  if (!worker || worker.status !== "active" || worker.auth_version !== session.worker_auth_version) return null;
  return { device, worker, hash };
}
