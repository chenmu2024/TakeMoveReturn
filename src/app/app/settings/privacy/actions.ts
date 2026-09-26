"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

const requestSchema = z.object({
  requestType: z.enum(["access", "export", "rectification", "deletion", "restriction"]),
  details: z.string().max(500),
});

export async function submitPrivacyRequest(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/login");
  const parsed = requestSchema.safeParse({
    requestType: form.get("requestType"),
    details: String(form.get("details") ?? "").trim(),
  });
  if (!parsed.success) redirect("/app/settings/privacy?notice=privacy-invalid");

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", auth.user.id).eq("status", "active").limit(1).maybeSingle();
  if (membershipError) throw new Error("Workspace membership could not be checked.");
  if (!membership) redirect("/app/onboarding");

  const { error } = await supabase.from("privacy_requests").insert({
    company_id: membership.company_id,
    requester_user_id: auth.user.id,
    request_type: parsed.data.requestType,
    details: parsed.data.details,
  });
  if (error?.code === "23505") redirect("/app/settings/privacy?notice=privacy-open");
  if (error) throw new Error("Privacy request could not be saved.");
  redirect("/app/settings/privacy?notice=privacy-saved");
}
