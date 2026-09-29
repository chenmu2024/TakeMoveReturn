"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

const invitationSchema = z.object({
  invitationId: z.string().uuid(),
});

export async function acceptWorkspaceInvitation(form: FormData) {
  if (!isSupabaseConfigured()) redirect("/auth/login?notice=unavailable&next=invitation");
  const parsed = invitationSchema.safeParse({ invitationId: form.get("invitation_id") });
  if (!parsed.success) redirect("/app/invitations?notice=invalid");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?next=invitation");

  const { error } = await supabase.rpc("accept_workspace_invitation", {
    p_invitation_id: parsed.data.invitationId,
  });
  if (error) {
    if (/expired/i.test(error.message)) redirect("/app/invitations?notice=expired");
    if (/limit/i.test(error.message)) redirect("/app/invitations?notice=limit");
    if (/email/i.test(error.message)) redirect("/app/invitations?notice=email");
    redirect("/app/invitations?notice=failed");
  }
  redirect("/app/dashboard?notice=invitation-accepted");
}
