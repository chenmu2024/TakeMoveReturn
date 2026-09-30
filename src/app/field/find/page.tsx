import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fieldDb, fieldWorker } from "../../../lib/field/server";
import "../../q/[token]/scan.css";

export const metadata: Metadata = { title: "Find a tool | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function FindToolPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const session = await fieldWorker();
  if (!session) redirect("/field");
  const code = (await searchParams).code?.trim() ?? "";
  let match: { name: string; qr_token: string } | null = null;
  if (code && code.length <= 80) {
    const { data, error } = await fieldDb().from("tools")
      .select("name,qr_token").eq("company_id", session.device.company_id)
      .eq("asset_code", code).neq("status", "retired").maybeSingle();
    if (error) throw new Error("Tool lookup could not be completed.");
    match = data;
  }
  return <main className="scan-page"><section className="scan-card">
    <p className="workspace-eyebrow">FIELD ACCESS · TOOL LOOKUP</p>
    <h1>Can&apos;t scan the QR?</h1>
    <p>Enter the asset code printed on the tool label. This search only checks tools in your enrolled company.</p>
    <form className="auth-form" action="/field/find" method="get">
      <label htmlFor="asset-code">Tool asset code</label>
      <input id="asset-code" name="code" required maxLength={80} defaultValue={code} autoCapitalize="characters" placeholder="TM-0184" />
      <button className="workspace-button" type="submit">Find tool</button>
    </form>
    {code.length > 80 && <p role="alert">Asset codes are at most 80 characters.</p>}
    {code && code.length <= 80 && !match && <p role="status">No active tool has that code in this company. Check the label or ask a manager.</p>}
    {match && <p role="status"><Link className="workspace-button" href={`/q/${match.qr_token}`}>Open {match.name} for TAKE, MOVE or RETURN</Link></p>}
    <p><Link href="/field">Back to field access</Link></p>
  </section></main>;
}
