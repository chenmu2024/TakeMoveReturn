"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

const requestSchema = z.object({
  requestType: z.enum(["access", "export", "rectification", "restriction"]),
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


const deleteAccountSchema = z.object({
  password: z.string().min(1).max(1024),
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export async function deleteAccount(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/login");
  const parsed = deleteAccountSchema.safeParse({
    password: String(form.get("password") ?? ""),
    confirmation: String(form.get("confirmation") ?? "").trim(),
  });
  if (!parsed.success) redirect("/app/settings/privacy?notice=privacy-delete-confirm");

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.email) redirect("/auth/login");

  const { data: reauthenticated, error: reauthError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: parsed.data.password,
  });
  if (reauthError || reauthenticated.user?.id !== auth.user.id) {
    redirect("/app/settings/privacy?notice=privacy-reauth");
  }

  const { data: existing, error: existingError } = await supabase.from("privacy_requests")
    .select("id,status")
    .eq("requester_user_id", auth.user.id)
    .eq("request_type", "deletion")
    .in("status", ["pending", "in_review"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) redirect("/app/settings/privacy?notice=privacy-delete-unavailable");
  if (existing?.status === "in_review") redirect("/app/settings/privacy?notice=privacy-open");

  const admin = createAdminClient();
  if (!admin) redirect("/app/settings/privacy?notice=privacy-delete-unavailable");

  let requestId = existing?.id ?? null;
  if (!requestId) {
    const { data: membership } = await supabase.from("organization_members")
      .select("company_id")
      .eq("user_id", auth.user.id)
      .eq("status", "active")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    const { data: created, error: createError } = await admin.from("privacy_requests")
      .insert({
        company_id: membership?.company_id ?? null,
        requester_user_id: auth.user.id,
        request_type: "deletion",
        details: "Self-service account deletion after password re-authentication.",
      })
      .select("id")
      .single();
    if (createError || !created?.id) redirect("/app/settings/privacy?notice=privacy-delete-unavailable");
    requestId = created.id;
  }

  const { error: beginError } = await admin.rpc("begin_account_deletion", {
    p_user_id: auth.user.id,
    p_request_id: requestId,
  });
  if (beginError) {
    if (beginError.message.includes("Owner transfer or workspace deletion required")) {
      redirect("/app/settings/privacy?notice=privacy-owner-required");
    }
    redirect("/app/settings/privacy?notice=privacy-delete-unavailable");
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(auth.user.id);
  if (deleteError) {
    await admin.from("privacy_requests").update({ status: "pending", completed_at: null }).eq("id", requestId);
    redirect("/app/settings/privacy?notice=privacy-delete-unavailable");
  }

  const { error: completeError } = await admin.from("privacy_requests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", requestId);
  if (completeError) {
    console.error(JSON.stringify({ event: "account_deletion_privacy_request_completion_failed", requestId }));
  }

  await supabase.auth.signOut().catch(() => undefined);
  redirect("/auth/login?notice=account-deleted");
}
