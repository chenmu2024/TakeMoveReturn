import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowRight, IconLock } from "@tabler/icons-react";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { acceptWorkspaceInvitation } from "./actions";
import "../service.css";

export const metadata: Metadata = {
  title: "Workspace Invitations | TakeMoveReturn",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Invitation = {
  invitation_id: string;
  company_name: string;
  role: "admin" | "manager";
  expires_at: string;
};

const notices: Record<string, string> = {
  invalid: "That invitation could not be identified.",
  expired: "That invitation has expired. Ask the workspace owner to send a new one.",
  limit: "The workspace is currently at its administrator limit. The owner must free a seat or upgrade the plan.",
  email: "This invitation belongs to a different email address.",
  failed: "The invitation could not be accepted. Ask the workspace owner to review it.",
};

export default async function InvitationsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/login?next=invitation");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login?next=invitation");

  const { data, error } = await supabase.rpc("list_my_workspace_invitations");
  if (error) throw new Error("Workspace invitations could not be loaded.");
  const invitations = (data ?? []) as Invitation[];
  const notice = (await searchParams).notice;

  return <main className="workspace-invitation-page">
    <section className="workspace-invitation-card">
      <Link className="workspace-brand" href="/"><strong>TakeMoveReturn</strong><span>Construction tool tracking</span></Link>
      <p className="workspace-eyebrow">WORKSPACE INVITATIONS</p>
      <h1>Join a construction workspace.</h1>
      <p>Only invitations sent to your signed-in email are shown here. Accepting one gives this account management access to that workspace; field workers continue to use the separate PIN workflow.</p>
      {notice && notices[notice] && <p className="workspace-connection-banner" role="alert">{notices[notice]}</p>}
      {invitations.length ? <div className="workspace-invitation-list">{invitations.map((invite) => <article className="workspace-panel" key={invite.invitation_id}>
        <div><p className="workspace-eyebrow">{invite.role.toUpperCase()}</p><h2>{invite.company_name}</h2><p>Invitation expires {invite.expires_at.slice(0, 10)}.</p></div>
        <form action={acceptWorkspaceInvitation}>
          <input type="hidden" name="invitation_id" value={invite.invitation_id} />
          <button className="workspace-button" type="submit">Accept invitation <IconArrowRight size={16} aria-hidden="true" /></button>
        </form>
      </article>)}</div> : <div className="workspace-blocked"><IconLock size={16} aria-hidden="true" />No active invitations were found for this email.</div>}
      <p className="workspace-plan-note">If an owner shared an invitation but it is not listed, confirm that you signed in with the exact invited email address.</p>
    </section>
  </main>;
}
