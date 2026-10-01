"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "../../../../lib/supabase/admin";
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


const closeAccountSchema = z.object({
  password: z.string().min(1).max(512),
  confirmation: z.literal("DELETE"),
});

export async function closeAccount(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/login");
  const parsed = closeAccountSchema.safeParse({
    password: String(form.get("password") ?? ""),
    confirmation: String(form.get("confirmation") ?? ""),
  });
  if (!parsed.success) redirect("/app/settings/privacy?notice=privacy-delete-confirm");

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.email) redirect("/auth/login");

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: parsed.data.password,
  });
  if (reauthError) redirect("/app/settings/privacy?notice=privacy-reauth");

  const { data: memberships, error: membershipError } = await supabase.from("organization_members")
    .select("id,company_id,role,status").eq("user_id", auth.user.id).eq("status", "active");
  if (membershipError) redirect("/app/settings/privacy?notice=privacy-delete-unavailable");

  for (const membership of memberships ?? []) {
    if (membership.role !== "owner") continue;
    const { count, error: ownerError } = await supabase.from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("company_id", membership.company_id).eq("status", "active").eq("role", "owner");
    if (ownerError) redirect("/app/settings/privacy?notice=privacy-delete-unavailable");
    if ((count ?? 0) <= 1) redirect("/app/settings/privacy?notice=privacy-owner");
  }

  const admin = createAdminClient();
  if (!admin) redirect("/app/settings/privacy?notice=privacy-delete-unavailable");

  const { data: profile } = await admin.from("profiles").select("display_name").eq("id", auth.user.id).maybeSingle();
  const activeMembershipIds = (memberships ?? []).map((membership) => membership.id);

  const { error: fulfilError } = await admin.rpc("fulfill_account_deletion", { p_user_id: auth.user.id });
  if (fulfilError) redirect("/app/settings/privacy?notice=privacy-delete-unavailable");

  const tombstoneEmail = `deleted+${auth.user.id}@users.invalid.takemovereturn.com`;
  const replacementPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const { error: identityError } = await admin.auth.admin.updateUserById(auth.user.id, {
    email: tombstoneEmail,
    password: replacementPassword,
    user_metadata: {},
    ban_duration: "876000h",
    email_confirm: true,
  });

  if (identityError) {
    if (activeMembershipIds.length) {
      await admin.from("organization_members").update({ status: "active", updated_at: new Date().toISOString() })
        .in("id", activeMembershipIds);
    }
    await admin.from("profiles").update({ display_name: profile?.display_name ?? null, updated_at: new Date().toISOString() })
      .eq("id", auth.user.id);
    await admin.from("privacy_requests").update({ status: "in_review", completed_at: null })
      .eq("requester_user_id", auth.user.id).eq("request_type", "deletion").eq("status", "completed");
    redirect("/app/settings/privacy?notice=privacy-delete-unavailable");
  }

  await supabase.auth.signOut();
  redirect("/?account=closed");
}
