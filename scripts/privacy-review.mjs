import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

// Local operator tool only: credentials are supplied by the operator's environment.
const [command, inputPath] = process.argv.slice(2);
if (!["list", "review"].includes(command) || (command === "review" && !inputPath)) {
  console.error("Usage: node scripts/privacy-review.mjs list | review <private-review.json>");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Operator credentials are not configured.");
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
if (command === "list") {
  const { data, error } = await client.from("privacy_requests")
    .select("id,request_type,status,created_at")
    .in("status", ["pending", "in_review"]).order("created_at").limit(100);
  if (error) throw new Error("Request list unavailable.");
  console.table(data);
  if (data.length === 100) console.log("First 100 open requests; process these before listing again.");
} else {
  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const { error } = await client.rpc("review_privacy_request", {
    p_request_id: input.requestId, p_expected_status: input.expectedStatus,
    p_status: input.status, p_operator_reference: input.operatorReference,
    p_evidence_reference: input.evidenceReference, p_response_summary: input.responseSummary,
  });
  if (error) throw new Error("Review not saved. Check input, current status and operator permissions.");
  console.log("Review saved. Notify the requester through the verified privacy contact.");
}
