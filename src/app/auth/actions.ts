"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/server";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function requireConnection() {
  if (!isSupabaseConfigured()) redirect("/auth/login?notice=unavailable");
}

export async function signIn(form: FormData) {
  requireConnection();
  const email = value(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) redirect("/auth/login?notice=required");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/auth/login?notice=invalid");
  redirect("/app/dashboard");
}

export async function signUp(form: FormData) {
  requireConnection();
  const email = value(form, "email");
  const password = String(form.get("password") ?? "");
  const companyName = value(form, "company");
  if (!email || password.length < 12 || companyName.length < 2 || companyName.length > 120) {
    redirect("/auth/signup?notice=required");
  }
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
      data: { company_name: companyName },
    },
  });
  if (error) redirect("/auth/signup?notice=signup-error");
  if (data.session) redirect("/app/dashboard");
  redirect("/auth/signup?notice=check-email");
}

export async function requestPasswordReset(form: FormData) {
  requireConnection();
  const email = value(form, "email");
  if (!email) redirect("/auth/forgot-password?notice=required");
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("/auth/callback?next=update-password", siteUrl).toString(),
  });
  redirect("/auth/forgot-password?notice=reset-sent");
}

export async function updatePassword(form: FormData) {
  requireConnection();
  const password = String(form.get("password") ?? "");
  if (password.length < 12) redirect("/auth/update-password?notice=required");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/login?notice=session-expired");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/auth/update-password?notice=update-error");
  redirect("/app/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/auth/login");
}
