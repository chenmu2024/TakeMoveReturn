"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { siteConfig } from "../../../config/site";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(1).max(64).refine((timezone) => {
    try { new Intl.DateTimeFormat("en", { timeZone: timezone }); return true; }
    catch { return false; }
  }),
});

export async function updateCompanySettings(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const parsed = settingsSchema.safeParse({ name: form.get("name"), timezone: form.get("timezone") });
  if (!parsed.success) redirect("/app/settings?notice=settings-invalid");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .in("role", ["owner", "admin"]).order("created_at").limit(1).maybeSingle();
  if (membershipError) redirect("/app/settings?notice=settings-unavailable");
  if (!membership) redirect("/app/settings?notice=settings-forbidden");
  const { error } = await supabase.rpc("update_company_settings", {
    p_company_id: membership.company_id,
    p_name: parsed.data.name,
    p_timezone: parsed.data.timezone,
  });
  if (error) redirect("/app/settings?notice=settings-unavailable");
  redirect("/app/settings?notice=settings-saved");
}


const inviteSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  role: z.enum(["admin", "manager"]),
});

const memberRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "manager"]),
});

const memberStatusSchema = z.object({
  userId: z.string().uuid(),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const invitationIdSchema = z.object({ invitationId: z.string().uuid() });

export async function inviteWorkspaceMember(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const parsed = inviteSchema.safeParse({ email: form.get("email"), role: form.get("role") });
  if (!parsed.success) redirect("/app/settings?notice=invite-invalid");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .eq("role", "owner").limit(1).maybeSingle();
  if (membershipError) redirect("/app/settings?notice=members-unavailable");
  if (!membership) redirect("/app/settings?notice=members-forbidden");

  const { data: invitationId, error } = await supabase.rpc("create_workspace_invitation", {
    p_company_id: membership.company_id,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (error || typeof invitationId !== "string") {
    if (/limit/i.test(error?.message ?? "")) redirect("/app/settings?notice=invite-limit");
    if (/already.*member/i.test(error?.message ?? "")) redirect("/app/settings?notice=invite-member");
    if (/already pending/i.test(error?.message ?? "")) redirect("/app/settings?notice=invite-pending");
    redirect("/app/settings?notice=members-unavailable");
  }

  const admin = createAdminClient();
  if (admin) {
    const redirectTo = new URL("/auth/callback?next=invitation", siteConfig.siteUrl).toString();
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, { redirectTo });
    if (!inviteError) redirect("/app/settings?notice=invite-sent");
  }

  redirect("/app/settings?notice=invite-created");
}

export async function revokeWorkspaceInvitation(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const parsed = invitationIdSchema.safeParse({ invitationId: form.get("invitation_id") });
  if (!parsed.success) redirect("/app/settings?notice=invite-invalid");
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_workspace_invitation", {
    p_invitation_id: parsed.data.invitationId,
  });
  if (error) redirect("/app/settings?notice=members-unavailable");
  redirect("/app/settings?notice=invite-revoked");
}

export async function updateWorkspaceMemberRole(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const parsed = memberRoleSchema.safeParse({
    userId: form.get("user_id"),
    role: form.get("role"),
  });
  if (!parsed.success) redirect("/app/settings?notice=member-invalid");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .eq("role", "owner").limit(1).maybeSingle();
  if (membershipError) redirect("/app/settings?notice=members-unavailable");
  if (!membership) redirect("/app/settings?notice=members-forbidden");

  const { error } = await supabase.rpc("update_workspace_member_role", {
    p_company_id: membership.company_id,
    p_user_id: parsed.data.userId,
    p_role: parsed.data.role,
  });
  if (error) redirect("/app/settings?notice=members-unavailable");
  redirect("/app/settings?notice=member-updated");
}

export async function setWorkspaceMemberStatus(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const parsed = memberStatusSchema.safeParse({
    userId: form.get("user_id"),
    active: form.get("active"),
  });
  if (!parsed.success) redirect("/app/settings?notice=member-invalid");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", claims.claims.sub).eq("status", "active")
    .eq("role", "owner").limit(1).maybeSingle();
  if (membershipError) redirect("/app/settings?notice=members-unavailable");
  if (!membership) redirect("/app/settings?notice=members-forbidden");

  const { error } = await supabase.rpc("set_workspace_member_active", {
    p_company_id: membership.company_id,
    p_user_id: parsed.data.userId,
    p_active: parsed.data.active,
  });
  if (error) {
    if (/limit/i.test(error.message)) redirect("/app/settings?notice=member-limit");
    redirect("/app/settings?notice=members-unavailable");
  }
  redirect(`/app/settings?notice=${parsed.data.active ? "member-reactivated" : "member-deactivated"}`);
}
