"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { siteConfig } from "../../config/site";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/server";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function requireConnection() {
  if (!isSupabaseConfigured()) redirect("/auth/login?notice=unavailable");
}

function nextDestination(form: FormData) {
  return form.get("next") === "invitation" ? "invitation" : null;
}

async function verifyTurnstile(form: FormData, fallback: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.TURNSTILE_SITE_KEY?.trim();
  if (!secret || !siteKey) return;

  const response = value(form, "cf-turnstile-response");
  if (!response) redirect(`${fallback}?notice=challenge`);

  const ip = (await headers()).get("cf-connecting-ip") ?? undefined;
  const body = new URLSearchParams({ secret, response });
  if (ip) body.set("remoteip", ip);

  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    const data = await result.json() as { success?: boolean };
    if (!result.ok || data.success !== true) redirect(`${fallback}?notice=challenge`);
  } catch {
    redirect(`${fallback}?notice=challenge`);
  }
}

export async function signIn(form: FormData) {
  requireConnection();
  await verifyTurnstile(form, "/auth/login");
  const email = value(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) redirect("/auth/login?notice=required");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/auth/login?notice=invalid${nextDestination(form) ? "&next=invitation" : ""}`);
  redirect(nextDestination(form) ? "/auth/accept-terms?next=invitation" : "/app/dashboard");
}

export async function signUp(form: FormData) {
  requireConnection();
  await verifyTurnstile(form, "/auth/signup");
  if (siteConfig.legal.legalReviewStatus !== "effective" || !siteConfig.legal.effectiveDate) {
    redirect("/auth/signup?notice=unavailable");
  }
  const email = value(form, "email");
  const password = String(form.get("password") ?? "");
  const companyName = value(form, "company");
  if (form.get("legal_consent") !== "yes") redirect("/auth/signup?notice=consent");
  if (!email || password.length < 12 || companyName.length < 2 || companyName.length > 120) {
    redirect("/auth/signup?notice=required");
  }
  const supabase = await createClient();
  const siteUrl = process.env.NODE_ENV === "production" ? siteConfig.siteUrl : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
      data: {
        company_name: companyName,
        terms_version: siteConfig.legal.effectiveDate,
        privacy_version: siteConfig.legal.effectiveDate,
        terms_accepted_at: new Date().toISOString(),
        privacy_acknowledged_at: new Date().toISOString(),
      },
    },
  });
  if (error) redirect("/auth/signup?notice=signup-error");
  if (data.session) redirect("/app/dashboard");
  redirect("/auth/signup?notice=check-email");
}

export async function requestPasswordReset(form: FormData) {
  requireConnection();
  await verifyTurnstile(form, "/auth/forgot-password");
  const email = value(form, "email");
  if (!email) redirect("/auth/forgot-password?notice=required");
  const supabase = await createClient();
  const siteUrl = process.env.NODE_ENV === "production" ? siteConfig.siteUrl : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  const invitationFlow = nextDestination(form) === "invitation";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL(invitationFlow ? "/auth/callback?next=update-password-invitation" : "/auth/callback?next=update-password", siteUrl).toString(),
  });
  redirect(`/auth/forgot-password?notice=reset-sent${invitationFlow ? "&next=invitation" : ""}`);
}

export async function updatePassword(form: FormData) {
  requireConnection();
  const password = String(form.get("password") ?? "");
  if (password.length < 12) redirect("/auth/update-password?notice=required");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/login?notice=session-expired");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/auth/update-password?notice=update-error${nextDestination(form) ? "&next=invitation" : ""}`);
  redirect(nextDestination(form) ? "/auth/accept-terms?next=invitation" : "/app/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/auth/login");
}
