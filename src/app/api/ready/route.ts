import { createClient, isSupabaseConfigured } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (!isSupabaseConfigured()) return Response.json({ status: "unavailable" }, { status: 503, headers });

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("companies").select("id", { head: true })
      .limit(1).abortSignal(AbortSignal.timeout(3000));
    if (error) throw error;
    return Response.json({ status: "ready" }, { headers });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}
