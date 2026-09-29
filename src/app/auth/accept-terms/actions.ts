"use server";

import { redirect } from "next/navigation";
import { siteConfig } from "../../../config/site";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

export async function acceptCurrentTerms(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/login?notice=unavailable");
  if (form.get("legal_consent") !== "yes") redirect(`/auth/accept-terms?notice=consent${form.get("next") === "invitation" ? "&next=invitation" : ""}`);
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?notice=session-expired");
  const now = new Date().toISOString();
  const { error } = await supabase.from("legal_acceptances").upsert({
    user_id: claims.claims.sub,
    terms_version: siteConfig.legal.effectiveDate,
    privacy_version: siteConfig.legal.effectiveDate,
    terms_accepted_at: now,
    privacy_acknowledged_at: now,
  }, { onConflict: "user_id" });
  if (error) redirect(`/auth/accept-terms?notice=failed${form.get("next") === "invitation" ? "&next=invitation" : ""}`);
  redirect(form.get("next") === "invitation" ? "/app/invitations" : "/app/dashboard");
}
