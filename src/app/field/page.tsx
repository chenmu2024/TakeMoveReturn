import type { Metadata } from "next";
import Link from "next/link";
import { fieldDb, fieldDevice, fieldWorker } from "../../lib/field/server";
import { lockWorker, signInWorker } from "./actions";
import "../q/[token]/scan.css";

export const metadata: Metadata = { title: "Field access | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function FieldPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const device = await fieldDevice();
  if (!device) return <main className="scan-page"><section className="scan-card"><p className="workspace-eyebrow">FIELD ACCESS</p><h1>Set up this shared device</h1><p>A workspace manager must enroll this device before a worker can sign in. A QR label alone never grants tool access.</p><Link className="workspace-button" href="/field/enroll">Enroll device</Link></section></main>;
  const db = fieldDb();
  const [{ data: company }, { data: workers }, session] = await Promise.all([
    db.from("companies").select("name").eq("id", device.company_id).maybeSingle(),
    db.from("workers").select("id,name").eq("company_id", device.company_id).eq("status", "active").order("name"),
    fieldWorker(),
  ]);
  const notice = (await searchParams).notice;
  return <main className="scan-page"><section className="scan-card"><p className="workspace-eyebrow">SHARED DEVICE · {company?.name ?? "WORKSPACE"}</p><h1>{session ? `Signed in as ${session.worker.name}` : "Worker sign-in"}</h1><p>Device access does not permit tool changes. Each worker must enter their own six-digit PIN.</p>{notice && <p role="alert">{notice === "device" ? "Device access expired. Ask a manager to enroll it again." : "PIN or worker unavailable. Check the details or wait before trying again."}</p>}{session ? <><p>Scan a tool label to TAKE, MOVE or RETURN it.</p><p><Link href="/field/find">Can&apos;t scan? Enter a tool code</Link></p><form action={lockWorker}><button className="workspace-button" type="submit">Lock / switch worker</button></form></> : <form className="auth-form" action={signInWorker}><label htmlFor="field-worker">Worker</label><select id="field-worker" name="workerId" required defaultValue=""><option value="" disabled>Choose your name</option>{workers?.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select><label htmlFor="field-pin">Six-digit PIN</label><input id="field-pin" name="pin" type="password" required pattern="[0-9]{6}" inputMode="numeric" minLength={6} maxLength={6} autoComplete="off" /><button className="workspace-button" type="submit">Sign in</button></form>}</section></main>;
}
