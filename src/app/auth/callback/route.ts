import { NextResponse, type NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const tokenType = request.nextUrl.searchParams.get("type");
  const nextParam = request.nextUrl.searchParams.get("next");
  const next = nextParam === "update-password"
    ? "/auth/update-password"
    : nextParam === "invitation"
      ? "/auth/update-password?next=invitation"
      : "/app/dashboard";
  if (isSupabaseConfigured() && (code || (tokenHash && (tokenType === "email" || tokenType === "recovery" || tokenType === "invite")))) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: tokenType as "email" | "recovery" | "invite" });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/auth/login?notice=callback-error", request.url));
}
