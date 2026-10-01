import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthShell, type AuthVariant } from "../../../components/auth-shell";
import { siteConfig } from "../../../config/site";
import { isSupabaseConfigured } from "../../../lib/supabase/server";

const variants = new Set<AuthVariant>(["login", "signup", "forgot-password", "update-password"]);

export default async function AuthPage({ params, searchParams }: { params: Promise<{ slug: string[] }>; searchParams: Promise<{ notice?: string; next?: string }> }) {
  const key = (await params).slug.join("/") as AuthVariant;
  if (!variants.has(key)) notFound();
  const query = await searchParams;
  return <AuthShell variant={key} notice={query.notice} next={query.next === "invitation" ? "invitation" : undefined} connected={isSupabaseConfigured()}
    registrationOpen={siteConfig.legal.legalReviewStatus === "effective" && Boolean(siteConfig.legal.effectiveDate)}
    turnstileSiteKey={process.env.TURNSTILE_SITE_KEY?.trim() || undefined} />;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const key = (await params).slug.join("/");
  return { title: `${key === "signup" ? "Create Account" : key === "forgot-password" ? "Reset Password" : key === "update-password" ? "Update Password" : "Sign In"} | TakeMoveReturn`, robots: { index: false, follow: false } };
}
