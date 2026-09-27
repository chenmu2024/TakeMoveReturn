import { redirect } from "next/navigation";
import { siteConfig } from "../../config/site";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/auth/signup");
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");
  const { data: acceptance, error } = await supabase.from("legal_acceptances")
    .select("terms_version,privacy_version").eq("user_id", claims.claims.sub).maybeSingle();
  if (error) throw new Error("Legal acceptance could not be checked.");
  if (acceptance?.terms_version !== siteConfig.legal.effectiveDate ||
      acceptance?.privacy_version !== siteConfig.legal.effectiveDate) redirect("/auth/accept-terms");
  return children;
}
