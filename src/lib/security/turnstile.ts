import "server-only";

import { headers } from "next/headers";

type TurnstileResponse = { success?: boolean; hostname?: string; ["error-codes"]?: string[] };

export function turnstileSiteKey() {
  return process.env.TURNSTILE_SITE_KEY?.trim() || null;
}

export function turnstileEnabled() {
  return Boolean(turnstileSiteKey() && process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstile(form: FormData) {
  const required = process.env.TURNSTILE_REQUIRED === "true";
  const siteKey = turnstileSiteKey();
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!siteKey || !secret) return !required;

  const token = String(form.get("cf-turnstile-response") ?? "").trim();
  if (!token) return false;

  const remoteIp = (await headers()).get("cf-connecting-ip") || undefined;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!response.ok) return false;
    const result = await response.json() as TurnstileResponse;
    return result.success === true;
  } catch {
    return false;
  }
}
