import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { siteConfig } from "../../../../../config/site";
import { createClient, isSupabaseConfigured } from "../../../../../lib/supabase/server";
import { rotateToolQr } from "../qr-actions";
import "./label.css";

export const metadata: Metadata = { title: "Tool QR label | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ToolLabelPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  if (!isSupabaseConfigured()) redirect("/auth/login");
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) redirect("/auth/login");
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id,role").eq("user_id", auth.user.id).eq("status", "active")
    .in("role", ["owner", "admin", "manager"]).limit(1).maybeSingle();
  if (membershipError) throw new Error("Workspace access could not be checked.");
  if (!membership) redirect("/app/onboarding");
  const [{ data: tool, error: toolError }, { data: company, error: companyError }] = await Promise.all([
    supabase.from("tools").select("id,name,asset_code,qr_token").eq("id", id).eq("company_id", membership.company_id).maybeSingle(),
    supabase.from("companies").select("name").eq("id", membership.company_id).single(),
  ]);
  if (toolError || companyError) throw new Error("Tool label could not be loaded.");
  if (!tool) notFound();

  const labelUrl = `${siteConfig.siteUrl}/q/${tool.qr_token}`;
  const svg = await QRCode.toString(labelUrl, { type: "svg", errorCorrectionLevel: "M", margin: 2, width: 400 });
  const imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const notice = (await searchParams).notice;
  return <main className="qr-label-page"><header><Link href={`/app/tools/${id}`}>← Back to tool</Link><span>TakeMoveReturn</span></header><section className="qr-label-card"><p>TOOL LABEL</p><h1>{tool.name}</h1><strong>{tool.asset_code}</strong><img src={imageUrl} width="260" height="260" alt={`QR label for ${tool.name}`} /><span>{company?.name}</span><small>Scan to identify this tool. Sign-in is required to change custody.</small></section><div className="qr-label-controls"><a href={imageUrl} download={`takemovereturn-${tool.asset_code}.svg`}>Download QR image</a>{membership.role !== "manager" && <form action={rotateToolQr}><input type="hidden" name="toolId" value={tool.id} /><button type="submit">Rotate QR code</button></form>}</div>{notice === "qr-rotated" && <p role="status">QR code rotated. Previously printed labels no longer work.</p>}{notice === "qr-error" && <p role="alert">The QR code could not be rotated. Try again.</p>}<p className="qr-label-warning">Rotate only if a label is lost or compromised. Reprint every affected label afterwards.</p></main>;
}
