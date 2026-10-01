import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) return new Response("Account access unavailable", { status: 503 });
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return new Response("Sign in required", { status: 401 });

  const [profile, memberships, requests, transactions, damageReports, serviceEvents] = await Promise.all([
    supabase.from("profiles").select("display_name,created_at,updated_at").eq("id", auth.user.id).maybeSingle(),
    supabase.from("organization_members").select("company_id,role,status,created_at,updated_at").eq("user_id", auth.user.id),
    supabase.from("privacy_requests").select("id,company_id,request_type,details,status,created_at,completed_at,response_summary").eq("requester_user_id", auth.user.id).order("created_at", { ascending: false }).limit(1001),
    supabase.from("tool_transactions").select("id,company_id,tool_id,transaction_type,created_at").eq("performed_by_user_id", auth.user.id).order("created_at", { ascending: false }).limit(5001),
    supabase.from("damage_reports").select("id,company_id,tool_id,severity,description,status,created_at,resolved_at").eq("reported_by_user_id", auth.user.id).order("created_at", { ascending: false }).limit(1001),
    supabase.from("maintenance_events").select("id,company_id,tool_id,service_name,notes,cost_cents,serviced_at").eq("performed_by_user_id", auth.user.id).order("serviced_at", { ascending: false }).limit(1001),
  ]);
  if (profile.error || memberships.error || requests.error || transactions.error || damageReports.error || serviceEvents.error) {
    return new Response("Account data could not be loaded", { status: 503 });
  }
  if ((requests.data?.length ?? 0) > 1000 || (transactions.data?.length ?? 0) > 5000 ||
      (damageReports.data?.length ?? 0) > 1000 || (serviceEvents.data?.length ?? 0) > 1000) {
    return new Response("Account data is too large for instant export. Submit an export request instead.", { status: 413 });
  }

  const document = {
    exported_at: new Date().toISOString(),
    scope: "Signed-in account data; company records and other people's personal data are not included.",
    account: { id: auth.user.id, email: auth.user.email, created_at: auth.user.created_at, last_sign_in_at: auth.user.last_sign_in_at },
    profile: profile.data,
    memberships: memberships.data ?? [],
    privacy_requests: requests.data ?? [],
    actions_performed: transactions.data ?? [],
    damage_reports_submitted: damageReports.data ?? [],
    service_events_recorded: serviceEvents.data ?? [],
  };
  return new Response(JSON.stringify(document, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="takemovereturn-account-data.json"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
