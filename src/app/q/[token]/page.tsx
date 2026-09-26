import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import "./scan.css";

export const metadata: Metadata = { title: "Scan a tool | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token) || !isSupabaseConfigured()) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_tool_qr", { p_token: token }).maybeSingle();
  if (error) throw new Error("The tool label could not be checked.");
  if (!data) notFound();
  const tool = data as { company_name: string; tool_name: string; asset_code: string };

  const { data: auth } = await supabase.auth.getClaims();
  let toolId: string | null = null;
  if (auth?.claims) {
    const { data: ownTool, error: toolError } = await supabase.from("tools")
      .select("id,company_id").eq("qr_token", token).maybeSingle();
    if (toolError) throw new Error("Workspace tool could not be checked.");
    if (ownTool) {
      const { data: membership, error: membershipError } = await supabase.from("organization_members")
        .select("company_id").eq("user_id", auth.claims.sub).eq("company_id", ownTool.company_id)
        .eq("status", "active").in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
      if (membershipError) throw new Error("Workspace access could not be checked.");
      toolId = membership ? ownTool.id : null;
    }
  }

  return <main className="scan-page"><section className="scan-card"><p className="workspace-eyebrow">TAKEMOVERETURN · TOOL LABEL</p><h1>{tool.tool_name}</h1><dl><div><dt>Company</dt><dd>{tool.company_name}</dd></div><div><dt>Asset code</dt><dd>{tool.asset_code}</dd></div></dl><p>A QR label identifies a tool. It does not grant access to custody or history.</p>{toolId ? <Link className="workspace-button" href={`/app/tools/${toolId}`}>Open tool record</Link> : <Link className="workspace-button" href="/auth/login">Sign in to manage tools</Link>}</section></main>;
}
