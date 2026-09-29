import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";
import { siteConfig } from "../../../config/site";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";
import { acceptCurrentTerms } from "./actions";

export const metadata: Metadata = { title: "Review Updated Terms | TakeMoveReturn", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AcceptTermsPage({ searchParams }: { searchParams: Promise<{ notice?: string; next?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/auth/login?notice=unavailable");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: acceptance, error } = await supabase.from("legal_acceptances")
    .select("terms_version,privacy_version").eq("user_id", claims.claims.sub).maybeSingle();
  if (error) throw new Error("Legal acceptance could not be checked.");
  const query = await searchParams;
  const next = query.next === "invitation" ? "invitation" : undefined;
  if (acceptance?.terms_version === siteConfig.legal.effectiveDate &&
      acceptance?.privacy_version === siteConfig.legal.effectiveDate) redirect(next ? "/app/invitations" : "/app/dashboard");
  const notice = query.notice;
  return <main className="auth-page"><section className="auth-brand-panel"><Link className="auth-brand" href="/"><strong>TakeMoveReturn</strong><span>Construction Tool Tracking Software</span></Link><div className="auth-brand-copy"><p className="eyebrow">WORKSPACE ACCESS</p><h1>Review the current terms before continuing.</h1></div></section><section className="auth-card-panel"><div className="auth-card"><p className="eyebrow">EFFECTIVE {siteConfig.legal.effectiveDate}</p><h2>Continue to your workspace.</h2><p className="auth-detail">Your account predates the current legal version. Please review it before using the workspace.</p>{notice && <p className="auth-connection-note" role="alert">{notice === "consent" ? "Please confirm your agreement before continuing." : "Your agreement could not be saved. Please try again."}</p>}<form className="auth-form" action={acceptCurrentTerms}>{next && <input type="hidden" name="next" value={next} />}<label className="auth-consent" htmlFor="auth-consent"><input id="auth-consent" name="legal_consent" type="checkbox" value="yes" required /><span>I agree to the <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and acknowledge the <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span></label><button className="auth-submit" type="submit">Agree and continue <IconArrowRight size={17} aria-hidden="true" /></button></form></div></section></main>;
}
