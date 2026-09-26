import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { csvDocument } from "../../../../lib/reports/csv";

const reports = {
  tools: { table: "tools", columns: ["asset_code", "name", "category", "brand", "model", "serial_number", "status", "condition", "updated_at"] },
  workers: { table: "workers", columns: ["name", "employee_code", "status", "updated_at"] },
  locations: { table: "locations", columns: ["name", "type", "address", "active", "updated_at"] },
  activity: { table: "tool_transactions", columns: ["tool_id", "transaction_type", "from_worker_id", "to_worker_id", "from_location_id", "to_location_id", "notes", "created_at"] },
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const kind = (await params).kind;
  if (!Object.hasOwn(reports, kind)) return new Response("Report not found", { status: 404 });
  if (!isSupabaseConfigured()) return new Response("Workspace unavailable", { status: 503 });

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return new Response("Sign in required", { status: 401 });
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id,role").eq("user_id", auth.user.id).eq("status", "active").limit(1).maybeSingle();
  if (membershipError) return new Response("Membership could not be checked", { status: 503 });
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return new Response("Owner or admin access required", { status: 403 });
  }

  const report = reports[kind as keyof typeof reports];
  const rows: unknown[][] = [];
  for (let offset = 0; offset <= 10_000; offset += 500) {
    const { data, error } = await supabase.from(report.table).select(report.columns.join(","))
      .eq("company_id", membership.company_id)
      .order(kind === "activity" ? "created_at" : "updated_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + 499);
    if (error || !data) return new Response("Report could not be loaded", { status: 503 });
    if (offset + data.length > 10_000) return new Response("Report is too large; contact support", { status: 413 });
    rows.push(...data.map((row) => report.columns.map((column) => (row as unknown as Record<string, unknown>)[column])));
    if (data.length < 500) break;
  }

  return new Response(csvDocument(report.columns, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="takemovereturn-${kind}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
